package com.olivepress.dto;

import jakarta.validation.constraints.NotBlank;

public final class PushDtos {

    private PushDtos() {
    }

    public record RegisterRequest(@NotBlank String token, String platform) {
    }

    public record UnregisterRequest(@NotBlank String token) {
    }
}
