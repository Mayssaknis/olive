package com.olivepress.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ClientDtos {

    public record ClientRequest(
            @NotBlank(message = "Prenom requis") @Size(max = 80) String firstName,
            @NotBlank(message = "Nom requis") @Size(max = 80) String lastName,
            @NotBlank(message = "Telephone requis") @Size(max = 30) String phone,
            @Size(max = 255) String address,
            Boolean active) {}

    public record ClientDto(
            Long id, String code, String firstName, String lastName, String fullName, String phone,
            String address, boolean active, Instant createdAt) {}

    private ClientDtos() {}
}
