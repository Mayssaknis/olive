package com.olivepress.service;

import com.olivepress.domain.*;
import com.olivepress.dto.LivraisonDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.dto.StockDtos;
import com.olivepress.exception.BusinessException;
import com.olivepress.exception.NotFoundException;
import com.olivepress.repository.ClientRepository;
import com.olivepress.repository.LivraisonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;

@Service
public class LivraisonService {

    private final LivraisonRepository livraisonRepository;
    private final ClientRepository clientRepository;
    private final StockService stockService;
    private final Mappers mappers;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final NumberSequenceService sequenceService;

    public LivraisonService(LivraisonRepository livraisonRepository, ClientRepository clientRepository,
                            StockService stockService, Mappers mappers, AuditService auditService,
                            NotificationService notificationService, NumberSequenceService sequenceService) {
        this.livraisonRepository = livraisonRepository;
        this.clientRepository = clientRepository;
        this.stockService = stockService;
        this.mappers = mappers;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.sequenceService = sequenceService;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<LivraisonDtos.LivraisonDto> search(Long clientId, Instant from, Instant to, Pageable pageable) {
        return livraisonRepository.search(clientId, from, to, pageable).map(mappers::toLivraisonDto);
    }

    public Livraison require(Long id) {
        return livraisonRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Livraison introuvable: " + id));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public LivraisonDtos.LivraisonDto getDto(Long id) {
        return mappers.toLivraisonDto(require(id));
    }

    /**
     * Enregistre une livraison : verifie la disponibilite puis cree le mouvement de SORTIE.
     */
    @Transactional
    public LivraisonDtos.LivraisonDto create(LivraisonDtos.LivraisonRequest req, User actor) {
        Client client = clientRepository.findById(req.clientId())
                .orElseThrow(() -> new NotFoundException("Client introuvable: " + req.clientId()));

        Livraison l = new Livraison();
        l.setNumero(sequenceService.nextLivraisonNumero(Year.now().getValue()));
        l.setClient(client);
        l.setQuantityL(req.quantityL());
        l.setLotNumber(req.lotNumber());
        l.setDeliveredAt(req.deliveredAt() == null ? Instant.now() : req.deliveredAt());
        l.setEmployee(actor);
        l.setObservations(req.observations());

        Livraison saved = livraisonRepository.save(l);

        // Sortie de stock associee (la dispo est reverifiee dans StockService).
        stockService.move(new StockDtos.StockMovementRequest(
                MovementType.SORTIE, req.quantityL(), req.lotNumber(), client.getId(),
                "Livraison " + saved.getNumero()), actor);

        notificationService.notifyAdmins("Livraison " + saved.getNumero(),
                client.getFullName() + " - " + req.quantityL() + " L",
                AppNotification.Type.LIVRAISON_ENREGISTREE, "LIVRAISON", saved.getId());
        auditService.log(actor, "CREATE", "LIVRAISON", saved.getId(),
                "Livraison " + saved.getNumero() + " - " + req.quantityL() + " L");
        return mappers.toLivraisonDto(saved);
    }
}
