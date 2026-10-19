package com.olivepress.dto;

import com.olivepress.domain.MovementType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class StockDtos {

    public record StockMovementRequest(
            @NotNull MovementType movementType,
            @NotNull @DecimalMin(value = "0.001", message = "Quantite doit etre > 0") BigDecimal quantityL,
            String lotNumber,
            Long clientId,
            String reason) {}

    public record StockMovementDto(
            Long id, MovementType movementType, BigDecimal quantityL, BigDecimal signedQuantity,
            String lotNumber, Long clientId, String clientName, String reason,
            String userName, Instant createdAt) {}

    public record StockSummaryDto(BigDecimal availableL, BigDecimal totalInL, BigDecimal totalOutL) {}

    private StockDtos() {}
}
