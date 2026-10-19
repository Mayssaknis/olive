package com.olivepress.service;

import com.olivepress.domain.*;
import com.olivepress.dto.ApportDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.exception.BusinessException;
import com.olivepress.exception.NotFoundException;
import com.olivepress.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;

@Service
public class ApportService {

    private final ApportRepository apportRepository;
    private final ApportStatusHistoryRepository historyRepository;
    private final ClientRepository clientRepository;
    private final ProductionRecordRepository productionRepository;
    private final Mappers mappers;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final NumberSequenceService sequenceService;
    private final FactureService factureService;
    private final SettingService settingService;

    public ApportService(ApportRepository apportRepository,
                         ApportStatusHistoryRepository historyRepository,
                         ClientRepository clientRepository,
                         ProductionRecordRepository productionRepository,
                         Mappers mappers,
                         AuditService auditService,
                         NotificationService notificationService,
                         NumberSequenceService sequenceService,
                         FactureService factureService,
                         SettingService settingService) {
        this.apportRepository = apportRepository;
        this.historyRepository = historyRepository;
        this.clientRepository = clientRepository;
        this.productionRepository = productionRepository;
        this.mappers = mappers;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.sequenceService = sequenceService;
        this.factureService = factureService;
        this.settingService = settingService;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<ApportDtos.ApportDto> search(String query, Long clientId, ApportStatus status,
                                             java.time.Instant from, java.time.Instant to, Pageable pageable) {
        return apportRepository.search(query, clientId, status, from, to, pageable).map(mappers::toApportDto);
    }

    public Apport require(Long id) {
        return apportRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Apport introuvable: " + id));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ApportDtos.ApportDto getDto(Long id) {
        return mappers.toApportDto(require(id));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ApportDtos.StatusHistoryDto> history(Long apportId) {
        return historyRepository.findByApportIdOrderByChangedAtAsc(apportId)
                .stream().map(mappers::toStatusHistoryDto).toList();
    }

    @Transactional
    public ApportDtos.ApportDto create(ApportDtos.ApportRequest req, User actor) {
        Client client = clientRepository.findById(req.clientId())
                .orElseThrow(() -> new NotFoundException("Client introuvable: " + req.clientId()));
        if (req.grossWeightKg() == null || req.grossWeightKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Le poids brut doit etre superieur a zero");
        }
        BigDecimal tare = req.tareKg() == null ? BigDecimal.ZERO : req.tareKg();
        if (tare.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("La tare ne peut pas etre negative");
        }
        if (tare.compareTo(req.grossWeightKg()) >= 0) {
            throw new BusinessException("La tare ne peut pas etre superieure ou egale au poids brut");
        }

        Apport a = new Apport();
        a.setNumero(sequenceService.nextApportNumero(Year.now().getValue()));
        a.setClient(client);
        a.setReceivedAt(req.receivedAt() == null ? java.time.Instant.now() : req.receivedAt());
        a.setGrossWeightKg(req.grossWeightKg());
        a.setTareKg(tare);
        a.recalculateNetWeight();
        a.setTicketNumber(req.ticketNumber() == null || req.ticketNumber().isBlank()
                ? sequenceService.nextTicketNumber()
                : req.ticketNumber().trim());
        a.setObservations(req.observations());
        a.setEmployee(actor);
        a.setStatus(ApportStatus.RECU);

        Apport saved = apportRepository.save(a);
        saveHistory(saved, null, ApportStatus.RECU, actor, "Apport cree");

        notificationService.notifyAdmins("Nouvel apport " + saved.getNumero(),
                "Client " + client.getFullName() + " - " + saved.getNetWeightKg() + " kg nets",
                AppNotification.Type.NOUVEL_APPORT, "APPORT", saved.getId());
        auditService.log(actor, "CREATE", "APPORT", saved.getId(),
                "Apport " + saved.getNumero() + " (" + saved.getNetWeightKg() + " kg)");

        factureService.createForApport(saved, settingService.getTarifPressage(), actor);
        return mappers.toApportDto(saved);
    }

    @Transactional
    public ApportDtos.ApportDto update(Long id, ApportDtos.ApportRequest req, User actor) {
        Apport a = require(id);
        if (a.getStatus() == ApportStatus.CLOTURE) {
            throw new BusinessException("Impossible de modifier un apport cloture");
        }
        Client client = clientRepository.findById(req.clientId())
                .orElseThrow(() -> new NotFoundException("Client introuvable: " + req.clientId()));
        BigDecimal tare = req.tareKg() == null ? BigDecimal.ZERO : req.tareKg();
        if (tare.compareTo(BigDecimal.ZERO) < 0 || tare.compareTo(req.grossWeightKg()) >= 0) {
            throw new BusinessException("Tare incoherente");
        }
        a.setClient(client);
        if (req.receivedAt() != null) a.setReceivedAt(req.receivedAt());
        a.setGrossWeightKg(req.grossWeightKg());
        a.setTareKg(tare);
        a.recalculateNetWeight();
        if (req.ticketNumber() != null && !req.ticketNumber().isBlank()) {
            a.setTicketNumber(req.ticketNumber().trim());
        }
        a.setObservations(req.observations());

        Apport saved = apportRepository.save(a);
        auditService.log(actor, "UPDATE", "APPORT", saved.getId(),
                "Maj apport " + saved.getNumero() + " - poids net " + saved.getNetWeightKg() + " kg");
        return mappers.toApportDto(saved);
    }

    /**
     * Transition d'etat. Enregistre l'ancienne et la nouvelle etape + horodatage + utilisateur.
     */
    @Transactional
    public ApportDtos.ApportDto updateStatus(Long id, ApportStatus newStatus, String comment, User actor) {
        Apport a = require(id);
        ApportStatus old = a.getStatus();
        if (old == newStatus) {
            return mappers.toApportDto(a);
        }
        if (old == ApportStatus.CLOTURE) {
            throw new BusinessException("Apport deja cloture");
        }
        a.setStatus(newStatus);
        Apport saved = apportRepository.save(a);
        saveHistory(saved, old, newStatus, actor, comment);

        if (newStatus == ApportStatus.PRODUCTION_TERMINEE) {
            notificationService.notifyAdmins("Production terminee " + saved.getNumero(),
                    "Client " + saved.getClient().getFullName(),
                    AppNotification.Type.PRODUCTION_TERMINEE, "APPORT", saved.getId());
        } else if (newStatus == ApportStatus.ANOMALIE) {
            notificationService.notifyAdmins("Anomalie sur apport " + saved.getNumero(),
                    comment == null ? "Anomalie signalee" : comment,
                    AppNotification.Type.ANOMALIE, "APPORT", saved.getId());
        }
        auditService.log(actor, "STATUS", "APPORT", saved.getId(),
                old + " -> " + newStatus + (comment != null ? " (" + comment + ")" : ""));
        return mappers.toApportDto(saved);
    }

    private void saveHistory(Apport a, ApportStatus from, ApportStatus to, User actor, String comment) {
        ApportStatusHistory h = new ApportStatusHistory();
        h.setApport(a);
        h.setFromStatus(from);
        h.setToStatus(to);
        h.setUser(actor);
        h.setComment(comment);
        historyRepository.save(h);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ApportDtos.ApportDto> recent() {
        return apportRepository.findTop10ByOrderByReceivedAtDesc().stream().map(mappers::toApportDto).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ApportDtos.ApportDto> byClient(Long clientId) {
        return apportRepository.findByClientIdOrderByReceivedAtDesc(clientId).stream().map(mappers::toApportDto).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ApportDtos.TicketDto ticket(Long id) {
        Apport a = require(id);
        return new ApportDtos.TicketDto(a.getNumero(), a.getClient().getFullName(), a.getClient().getCode(),
                a.getReceivedAt(),
                a.getGrossWeightKg(), a.getTareKg(), a.getNetWeightKg(), a.getTicketNumber(), a.getObservations());
    }
}
