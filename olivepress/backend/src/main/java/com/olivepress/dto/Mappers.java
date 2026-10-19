package com.olivepress.dto;

import com.olivepress.domain.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Conversion entites <-> DTOs. Evite d'exposer les entites JPA directement dans l'API.
 */
@Component
public class Mappers {

    public AuthDtos.UserDto toUserDto(User u) {
        if (u == null) return null;
        return new AuthDtos.UserDto(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(),
                u.getPhone(), u.getRole(), u.getPermissions(), u.isActive(), u.getCreatedAt());
    }

    public ClientDtos.ClientDto toClientDto(Client c) {
        if (c == null) return null;
        return new ClientDtos.ClientDto(c.getId(), c.getCode(), c.getFirstName(), c.getLastName(),
                c.getFullName(), c.getPhone(), c.getAddress(), c.isActive(), c.getCreatedAt());
    }

    public ApportDtos.ApportDto toApportDto(Apport a) {
        if (a == null) return null;
        return new ApportDtos.ApportDto(
                a.getId(), a.getNumero(),
                a.getClient() == null ? null : a.getClient().getId(),
                a.getClient() == null ? null : a.getClient().getFullName(),
                a.getClient() == null ? null : a.getClient().getCode(),
                a.getReceivedAt(), a.getGrossWeightKg(), a.getTareKg(), a.getNetWeightKg(),
                a.getTicketNumber(), a.getObservations(),
                a.getEmployee() == null ? null : a.getEmployee().getFullName(),
                a.getStatus(), a.getCreatedAt(), a.getUpdatedAt());
    }

    public ProductionDtos.ProductionDto toProductionDto(ProductionRecord p) {
        if (p == null) return null;
        return new ProductionDtos.ProductionDto(
                p.getId(),
                p.getApport() == null ? null : p.getApport().getId(),
                p.getApport() == null ? null : p.getApport().getNumero(),
                p.getApport() == null ? null : p.getApport().getClient().getFullName(),
                p.getOlivesProcessedKg(), p.getOilObtainedL(), p.getYieldPercent(),
                p.getProductionDate(),
                p.getEmployee() == null ? null : p.getEmployee().getFullName(),
                p.getNotes(), p.getCreatedAt());
    }

    public ApportDtos.StatusHistoryDto toStatusHistoryDto(ApportStatusHistory h) {
        if (h == null) return null;
        return new ApportDtos.StatusHistoryDto(h.getId(), h.getFromStatus(), h.getToStatus(),
                h.getUser() == null ? null : h.getUser().getFullName(), h.getChangedAt(), h.getComment());
    }

    public StockDtos.StockMovementDto toStockDto(StockMovement m) {
        if (m == null) return null;
        return new StockDtos.StockMovementDto(
                m.getId(), m.getMovementType(), m.getQuantityL(), m.signedQuantity(),
                m.getLotNumber(),
                m.getClient() == null ? null : m.getClient().getId(),
                m.getClient() == null ? null : m.getClient().getFullName(),
                m.getReason(),
                m.getUser() == null ? null : m.getUser().getFullName(),
                m.getCreatedAt());
    }

    public LivraisonDtos.LivraisonDto toLivraisonDto(Livraison l) {
        if (l == null) return null;
        return new LivraisonDtos.LivraisonDto(
                l.getId(), l.getNumero(),
                l.getClient() == null ? null : l.getClient().getId(),
                l.getClient() == null ? null : l.getClient().getFullName(),
                l.getClient() == null ? null : l.getClient().getCode(),
                l.getQuantityL(), l.getLotNumber(), l.getDeliveredAt(),
                l.getEmployee() == null ? null : l.getEmployee().getFullName(),
                l.getObservations());
    }

    public FactureDtos.FactureDto toFactureDto(Facture f, java.math.BigDecimal paid) {
        if (f == null) return null;
        java.math.BigDecimal paidAmt = paid == null ? java.math.BigDecimal.ZERO : paid;
        java.math.BigDecimal remaining = f.getTotalAmount().subtract(paidAmt);
        List<FactureDtos.LineDto> lines = f.getLines().stream()
                .map(l -> new FactureDtos.LineDto(l.getId(), l.getDescription(), l.getQuantity(),
                        l.getUnitPrice(), l.getTotal()))
                .toList();
        return new FactureDtos.FactureDto(
                f.getId(), f.getNumero(),
                f.getClient() == null ? null : f.getClient().getId(),
                f.getClient() == null ? null : f.getClient().getFullName(),
                f.getClient() == null ? null : f.getClient().getCode(),
                f.getInvoiceDate(), f.getDueDate(), f.getTotalAmount(), paidAmt, remaining,
                f.getStatut(), f.getNotes(), lines, f.getCreatedAt(), f.getApportId());
    }

    public FactureDtos.PaiementDto toPaiementDto(Paiement p) {
        if (p == null) return null;
        return new FactureDtos.PaiementDto(
                p.getId(),
                p.getFacture() == null ? null : p.getFacture().getId(),
                p.getFacture() == null ? null : p.getFacture().getNumero(),
                p.getAmount(), p.getMode(), p.getReference(), p.getPaidAt(),
                p.getEmployee() == null ? null : p.getEmployee().getFullName());
    }

    public DashboardDtos.NotificationDto toNotificationDto(AppNotification n) {
        if (n == null) return null;
        return new DashboardDtos.NotificationDto(n.getId(), n.getTitle(), n.getMessage(), n.getType(),
                n.isReadFlag(), n.getEntityType(), n.getEntityId(), n.getCreatedAt());
    }

    public DashboardDtos.HistoryDto toHistoryDto(AuditLog l) {
        if (l == null) return null;
        return new DashboardDtos.HistoryDto(l.getId(),
                l.getUser() == null ? null : l.getUser().getFullName(),
                l.getAction(), l.getEntityType(), l.getEntityId(), l.getDetails(), l.getCreatedAt());
    }
}
