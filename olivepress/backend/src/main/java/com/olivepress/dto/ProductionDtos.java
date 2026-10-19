package com.olivepress.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class ProductionDtos {

    public record ProductionRequest(
            @NotNull Long apportId,
            @NotNull @DecimalMin(value = "0.001", message = "Olives traitees doivent etre > 0") BigDecimal olivesProcessedKg,
            @NotNull @DecimalMin(value = "0.001", message = "Huile obtenue doit etre > 0") BigDecimal oilObtainedL,
            @NotNull LocalDate productionDate,
            String notes) {}

    public record ProductionDto(
            Long id, Long apportId, String apportNumero, String clientName,
            BigDecimal olivesProcessedKg, BigDecimal oilObtainedL, BigDecimal yieldPercent,
            LocalDate productionDate, String employeeName, String notes, Instant createdAt) {}

    private ProductionDtos() {}
}
