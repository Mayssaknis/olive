package com.olivepress.dto;

import com.olivepress.domain.Facture;
import com.olivepress.domain.Paiement;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class FactureDtos {

    public record LineRequest(
            @NotBlank String description,
            @NotNull @DecimalMin(value = "0.0001") BigDecimal quantity,
            @NotNull @DecimalMin(value = "0.001") BigDecimal unitPrice) {}

    public record LineDto(Long id, String description, BigDecimal quantity,
                          BigDecimal unitPrice, BigDecimal total) {}

    public record FactureRequest(
            @NotNull Long clientId,
            LocalDate invoiceDate,
            LocalDate dueDate,
            String notes,
            @NotNull(message = "Au moins une ligne requise") List<@NotNull LineRequest> lines) {}

    public record FactureDto(
            Long id, String numero, Long clientId, String clientName, String clientCode, LocalDate invoiceDate,
            LocalDate dueDate, BigDecimal totalAmount, BigDecimal paidAmount, BigDecimal remainingAmount,
            Facture.Statut statut, String notes, List<LineDto> lines, Instant createdAt, Long apportId) {}

    public record PaiementRequest(
            @NotNull @DecimalMin(value = "0.001", message = "Montant doit etre > 0") BigDecimal amount,
            @NotNull Paiement.Mode mode,
            String reference,
            Instant paidAt) {}

    public record PaiementDto(
            Long id, Long factureId, String factureNumero, BigDecimal amount, Paiement.Mode mode,
            String reference, Instant paidAt, String employeeName) {}

    private FactureDtos() {}
}
