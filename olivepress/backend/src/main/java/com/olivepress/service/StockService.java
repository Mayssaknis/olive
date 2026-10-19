package com.olivepress.service;

import com.olivepress.domain.*;
import com.olivepress.dto.Mappers;
import com.olivepress.dto.StockDtos;
import com.olivepress.exception.BusinessException;
import com.olivepress.repository.ClientRepository;
import com.olivepress.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class StockService {

    private final StockMovementRepository stockRepository;
    private final ClientRepository clientRepository;
    private final Mappers mappers;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public StockService(StockMovementRepository stockRepository, ClientRepository clientRepository,
                        Mappers mappers, AuditService auditService, NotificationService notificationService) {
        this.stockRepository = stockRepository;
        this.clientRepository = clientRepository;
        this.mappers = mappers;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    public BigDecimal availableStock() {
        return stockRepository.availableStock();
    }

    public StockDtos.StockSummaryDto summary() {
        BigDecimal in = stockRepository.sumIn();
        BigDecimal out = stockRepository.sumOut();
        return new StockDtos.StockSummaryDto(
                availableStock(),
                in == null ? BigDecimal.ZERO : in,
                out == null ? BigDecimal.ZERO : out);
    }

    public Page<StockDtos.StockMovementDto> movements(Pageable pageable) {
        return stockRepository.findAllByOrderByCreatedAtDesc(pageable).map(mappers::toStockDto);
    }

    /**
     * Enregistre un mouvement de stock. Une SORTIE ou AJUSTEMENT_NEGATIF ne peut pas
     * faire descendre le stock sous zero.
     */
    @Transactional
    public StockDtos.StockMovementDto move(StockDtos.StockMovementRequest req, User actor) {
        StockMovement m = new StockMovement();
        m.setMovementType(req.movementType());
        m.setQuantityL(req.quantityL());
        m.setLotNumber(req.lotNumber());
        m.setReason(req.reason());
        m.setUser(actor);

        if (req.clientId() != null) {
            Client c = clientRepository.findById(req.clientId())
                    .orElseThrow(() -> new com.olivepress.exception.NotFoundException("Client introuvable"));
            m.setClient(c);
        }

        if (isOutflow(req.movementType())) {
            BigDecimal available = availableStock();
            if (req.quantityL().compareTo(available) > 0) {
                notificationService.notifyAdmins("Stock insuffisant",
                        "Sortie de " + req.quantityL() + " L demandee alors que " + available + " L disponibles",
                        AppNotification.Type.STOCK_INSUFFISANT, "STOCK", null);
                throw new BusinessException(
                        "Stock insuffisant : " + available + " L disponibles, " + req.quantityL() + " L demandes");
            }
        }

        StockMovement saved = stockRepository.save(m);
        auditService.log(actor, "STOCK_" + req.movementType(), "STOCK", saved.getId(),
                req.movementType() + " " + req.quantityL() + " L"
                        + (req.lotNumber() != null ? " lot " + req.lotNumber() : ""));
        return mappers.toStockDto(saved);
    }

    /** Enregistre une ENTREE (appele apres production validee). */
    @Transactional
    public StockDtos.StockMovementDto addEntry(BigDecimal quantityL, String lotNumber, User actor, String reason) {
        return move(new StockDtos.StockMovementRequest(MovementType.ENTREE, quantityL, lotNumber, null, reason), actor);
    }

    private boolean isOutflow(MovementType t) {
        return t == MovementType.SORTIE || t == MovementType.AJUSTEMENT_NEGATIF;
    }
}
