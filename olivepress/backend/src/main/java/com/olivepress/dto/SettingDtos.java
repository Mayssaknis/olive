package com.olivepress.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class SettingDtos {

    public record TarifDto(BigDecimal tarifParKg, Instant updatedAt) {}

    public record TarifUpdateRequest(
            @NotNull(message = "Tarif requis")
            @DecimalMin(value = "0.001", message = "Le tarif doit etre superieur a zero")
            BigDecimal tarifParKg) {}

    private SettingDtos() {}
}
