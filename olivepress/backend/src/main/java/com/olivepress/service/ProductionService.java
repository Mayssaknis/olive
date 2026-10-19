package com.olivepress.service;

import com.olivepress.domain.*;
import com.olivepress.dto.Mappers;
import com.olivepress.dto.ProductionDtos;
import com.olivepress.exception.BusinessException;
import com.olivepress.repository.ProductionRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ProductionService {

    private final ProductionRecordRepository productionRepository;
    private final ApportService apportService;
    private final Mappers mappers;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ProductionService(ProductionRecordRepository productionRepository,
                             ApportService apportService,
                             Mappers mappers,
                             AuditService auditService,
                             NotificationService notificationService) {
        this.productionRepository = productionRepository;
        this.apportService = apportService;
        this.mappers = mappers;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ProductionDtos.ProductionDto> byApport(Long apportId) {
        return productionRepository.findByApportIdOrderByCreatedAtDesc(apportId)
                .stream().map(mappers::toProductionDto).toList();
    }

    /**
     * Enregistre une production et calcule le rendement :
     * rendement(%) = huile obtenue (L) / olives traitees (kg) * 100
     * (1 kg d'olives ~ 1 L pour les unites d'huilerie ; conversion documentee).
     */
    @Transactional
    public ProductionDtos.ProductionDto record(ProductionDtos.ProductionRequest req, User actor) {
        Apport apport = apportService.require(req.apportId());

        if (req.olivesProcessedKg().compareTo(BigDecimal.ZERO) <= 0
                || req.oilObtainedL().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Les quantites doivent etre superieures a zero");
        }
        if (req.olivesProcessedKg().compareTo(apport.getNetWeightKg()) > 0) {
            throw new BusinessException(
                    "Les olives traitees (" + req.olivesProcessedKg() + " kg) depassent le poids net de l'apport ("
                            + apport.getNetWeightKg() + " kg)");
        }

        BigDecimal yield = req.oilObtainedL()
                .multiply(new BigDecimal("100"))
                .divide(req.olivesProcessedKg(), 3, RoundingMode.HALF_UP);

        ProductionRecord p = new ProductionRecord();
        p.setApport(apport);
        p.setOlivesProcessedKg(req.olivesProcessedKg());
        p.setOilObtainedL(req.oilObtainedL());
        p.setYieldPercent(yield);
        p.setProductionDate(req.productionDate());
        p.setEmployee(actor);
        p.setNotes(req.notes());

        ProductionRecord saved = productionRepository.save(p);

        // Passe automatiquement l'apport en "Production terminee" si ce n'est pas deja fait.
        if (apport.getStatus() != ApportStatus.PRODUCTION_TERMINEE
                && apport.getStatus() != ApportStatus.STOCKAGE
                && apport.getStatus() != ApportStatus.CLOTURE) {
            apportService.updateStatus(apport.getId(), ApportStatus.PRODUCTION_TERMINEE,
                    "Production enregistree (rendement " + yield + "%)", actor);
        }

        auditService.log(actor, "CREATE", "PRODUCTION", saved.getId(),
                "Production apport " + apport.getNumero() + " - rendement " + yield + "%");
        return mappers.toProductionDto(saved);
    }
}
