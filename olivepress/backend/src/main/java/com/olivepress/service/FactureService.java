package com.olivepress.service;

import com.olivepress.domain.*;
import com.olivepress.dto.FactureDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.exception.BusinessException;
import com.olivepress.exception.NotFoundException;
import com.olivepress.repository.ClientRepository;
import com.olivepress.repository.FactureRepository;
import com.olivepress.repository.PaiementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

@Service
public class FactureService {

    private final FactureRepository factureRepository;
    private final PaiementRepository paiementRepository;
    private final ClientRepository clientRepository;
    private final Mappers mappers;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final NumberSequenceService sequenceService;

    public FactureService(FactureRepository factureRepository, PaiementRepository paiementRepository,
                          ClientRepository clientRepository, Mappers mappers, AuditService auditService,
                          NotificationService notificationService, NumberSequenceService sequenceService) {
        this.factureRepository = factureRepository;
        this.paiementRepository = paiementRepository;
        this.clientRepository = clientRepository;
        this.mappers = mappers;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.sequenceService = sequenceService;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<FactureDtos.FactureDto> search(Long clientId, Facture.Statut statut,
                                               LocalDate from, LocalDate to, Pageable pageable) {
        return factureRepository.search(clientId, statut, from, to, pageable)
                .map(f -> mappers.toFactureDto(f, paidOf(f.getId())));
    }

    public Facture require(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Facture introuvable: " + id));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public FactureDtos.FactureDto getDto(Long id) {
        Facture f = require(id);
        return mappers.toFactureDto(f, paidOf(id));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<FactureDtos.FactureDto> byClient(Long clientId) {
        return factureRepository.findByClientIdOrderByInvoiceDateDesc(clientId)
                .stream().map(f -> mappers.toFactureDto(f, paidOf(f.getId()))).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<FactureDtos.PaiementDto> payments(Long factureId) {
        require(factureId);
        return paiementRepository.findByFactureIdOrderByPaidAtDesc(factureId)
                .stream().map(mappers::toPaiementDto).toList();
    }

    @Transactional
    public FactureDtos.FactureDto create(FactureDtos.FactureRequest req, User actor) {
        Client client = clientRepository.findById(req.clientId())
                .orElseThrow(() -> new NotFoundException("Client introuvable: " + req.clientId()));
        if (req.lines() == null || req.lines().isEmpty()) {
            throw new BusinessException("La facture doit contenir au moins une ligne");
        }

        Facture f = new Facture();
        f.setNumero(sequenceService.nextFactureNumero(Year.now().getValue()));
        f.setClient(client);
        f.setInvoiceDate(req.invoiceDate() == null ? LocalDate.now() : req.invoiceDate());
        f.setDueDate(req.dueDate());
        f.setNotes(req.notes());
        f.setStatut(Facture.Statut.IMPAYEE);

        for (FactureDtos.LineRequest lineReq : req.lines()) {
            FactureLine line = new FactureLine();
            line.setFacture(f);
            line.setDescription(lineReq.description());
            line.setQuantity(lineReq.quantity());
            line.setUnitPrice(lineReq.unitPrice());
            line.recalculateTotal();
            f.getLines().add(line);
        }
        f.recalculateTotal();

        Facture saved = factureRepository.save(f);
        auditService.log(actor, "CREATE", "FACTURE", saved.getId(),
                "Facture " + saved.getNumero() + " - " + saved.getTotalAmount() + " DT");
        return mappers.toFactureDto(saved, BigDecimal.ZERO);
    }

    /**
     * Cree automatiquement la facture liee a un nouvel apport, au tarif de pressage
     * courant (DT/kg net). Appelee par ApportService apres l'enregistrement.
     */
    @Transactional
    public FactureDtos.FactureDto createForApport(Apport apport, java.math.BigDecimal tarifParKg, User actor) {
        Facture f = new Facture();
        f.setNumero(sequenceService.nextFactureNumero(Year.now().getValue()));
        f.setClient(apport.getClient());
        f.setInvoiceDate(LocalDate.now());
        f.setStatut(Facture.Statut.IMPAYEE);
        f.setNotes("Facture automatique - apport " + apport.getNumero());
        f.setApportId(apport.getId());

        FactureLine line = new FactureLine();
        line.setFacture(f);
        line.setDescription("Pressage olives - " + apport.getNumero());
        line.setQuantity(apport.getNetWeightKg());
        line.setUnitPrice(tarifParKg);
        line.recalculateTotal();
        f.getLines().add(line);
        f.recalculateTotal();

        Facture saved = factureRepository.save(f);
        notificationService.notifyAdmins("Facture auto " + saved.getNumero(),
                "Apport " + apport.getNumero() + " - " + saved.getTotalAmount() + " DT",
                AppNotification.Type.PAIEMENT_ENREGISTRE, "FACTURE", saved.getId());
        auditService.log(actor, "CREATE_AUTO", "FACTURE", saved.getId(),
                "Facture auto " + saved.getNumero() + " pour apport " + apport.getNumero()
                        + " - " + apport.getNetWeightKg() + " kg x " + tarifParKg + " DT");
        return mappers.toFactureDto(saved, BigDecimal.ZERO);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public FactureDtos.FactureDto byApport(Long apportId) {
        return factureRepository.findByApportId(apportId)
                .map(f -> mappers.toFactureDto(f, paidOf(f.getId())))
                .orElse(null);
    }

    /**
     * Enregistre un paiement (partiel ou total) et recalcule le statut de la facture.
     */
    @Transactional
    public FactureDtos.FactureDto pay(Long factureId, FactureDtos.PaiementRequest req, User actor) {
        Facture f = require(factureId);
        BigDecimal alreadyPaid = paidOf(factureId);
        BigDecimal remaining = f.getTotalAmount().subtract(alreadyPaid);

        if (req.amount().compareTo(remaining) > 0) {
            throw new BusinessException("Le montant (" + req.amount()
                    + " DT) depasse le solde restant (" + remaining + " DT)");
        }

        Paiement p = new Paiement();
        p.setFacture(f);
        p.setAmount(req.amount());
        p.setMode(req.mode());
        p.setReference(req.reference());
        p.setPaidAt(req.paidAt() == null ? java.time.Instant.now() : req.paidAt());
        p.setEmployee(actor);
        paiementRepository.save(p);

        BigDecimal newPaid = alreadyPaid.add(req.amount());
        int cmp = newPaid.compareTo(f.getTotalAmount());
        f.setStatut(cmp >= 0 ? Facture.Statut.PAYEE
                : (newPaid.compareTo(BigDecimal.ZERO) > 0 ? Facture.Statut.PARTIELLE : Facture.Statut.IMPAYEE));
        factureRepository.save(f);

        notificationService.notifyAdmins("Paiement enregistre",
                "Facture " + f.getNumero() + " - " + req.amount() + " DT (" + f.getStatut() + ")",
                AppNotification.Type.PAIEMENT_ENREGISTRE, "FACTURE", f.getId());
        auditService.log(actor, "PAYMENT", "FACTURE", f.getId(),
                "Paiement " + req.amount() + " DT sur " + f.getNumero() + " -> " + f.getStatut());
        return mappers.toFactureDto(f, newPaid);
    }

    private BigDecimal paidOf(Long factureId) {
        BigDecimal s = paiementRepository.sumByFacture(factureId);
        return s == null ? BigDecimal.ZERO : s;
    }
}
