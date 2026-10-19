package com.olivepress.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class LivraisonDtos {

    public record LivraisonRequest(
            @NotNull(message = "Client requis") Long clientId,
            @NotNull @DecimalMin(value = "0.001", message = "Quantite doit etre > 0") BigDecimal quantityL,
            String lotNumber,
            Instant deliveredAt,
            String observations) {}

    public record LivraisonDto(
            Long id, String numero, Long clientId, String clientName, String clientCode, BigDecimal quantityL,
            String lotNumber, Instant deliveredAt, String employeeName, String observations) {}

    private LivraisonDtos() {}
}
