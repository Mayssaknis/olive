package com.olivepress.dto;

import com.olivepress.domain.ApportStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class ApportDtos {

    public record ApportRequest(
            @NotNull(message = "Client requis") Long clientId,
            Instant receivedAt,
            @NotNull @DecimalMin(value = "0.001", message = "Poids brut doit etre > 0") BigDecimal grossWeightKg,
            @DecimalMin(value = "0", message = "Tare ne peut pas etre negative") BigDecimal tareKg,
            String ticketNumber,
            String observations) {}

    public record ApportStatusUpdateRequest(
            @NotNull ApportStatus status,
            String comment) {}

    public record ApportDto(
            Long id, String numero, Long clientId, String clientName, String clientCode,
            Instant receivedAt, BigDecimal grossWeightKg, BigDecimal tareKg, BigDecimal netWeightKg,
            String ticketNumber, String observations, String employeeName,
            ApportStatus status, Instant createdAt, Instant updatedAt) {}

    public record TicketDto(
            String numero, String clientName, String clientCode, Instant receivedAt,
            BigDecimal grossWeightKg, BigDecimal tareKg, BigDecimal netWeightKg,
            String ticketNumber, String observations) {}

    public record StatusHistoryDto(
            Long id, ApportStatus fromStatus, ApportStatus toStatus,
            String userName, Instant changedAt, String comment) {}

    private ApportDtos() {}
}
