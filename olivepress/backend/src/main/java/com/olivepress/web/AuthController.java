package com.olivepress.web;

import com.olivepress.dto.AuthDtos;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.AuthService;
import com.olivepress.dto.Mappers;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final Mappers mappers;

    public AuthController(AuthService authService, Mappers mappers) {
        this.authService = authService;
        this.mappers = mappers;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.LoginResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthDtos.LoginResponse> refresh(@Valid @RequestBody AuthDtos.RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserDto> me() {
        return ResponseEntity.ok(mappers.toUserDto(SecurityUtils.currentUser()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody AuthDtos.ChangePasswordRequest req) {
        authService.changePassword(SecurityUtils.currentUser(), req);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifie"));
    }
}
