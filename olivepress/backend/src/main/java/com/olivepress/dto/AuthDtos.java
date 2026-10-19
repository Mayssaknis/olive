package com.olivepress.dto;

import com.olivepress.domain.Permission;
import com.olivepress.domain.Role;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Set;

public final class AuthDtos {

    public record LoginRequest(
            @NotBlank(message = "Identifiant requis") String username,
            @NotBlank(message = "Mot de passe requis") String password) {}

    public record LoginResponse(String token, String refreshToken, UserDto user) {}

    public record RefreshRequest(@NotBlank(message = "Refresh token requis") String refreshToken) {}

    public record UserDto(
            Long id, String username, String email, String fullName, String phone,
            Role role, Set<Permission> permissions, boolean active, Instant createdAt) {}

    public record UserCreateRequest(
            @NotBlank String username,
            @NotBlank String email,
            @NotBlank String password,
            @NotBlank String fullName,
            String phone,
            Role role,
            Set<Permission> permissions,
            Boolean active) {}

    public record UserUpdateRequest(
            String email, String fullName, String phone, Role role,
            Set<Permission> permissions, Boolean active, String password) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword) {}

    private AuthDtos() {}
}
