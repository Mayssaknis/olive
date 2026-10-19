package com.olivepress.service;

import com.olivepress.domain.Permission;
import com.olivepress.domain.Role;
import com.olivepress.domain.User;
import com.olivepress.dto.AuthDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.exception.BusinessException;
import com.olivepress.exception.NotFoundException;
import com.olivepress.repository.UserRepository;
import com.olivepress.security.JwtService;
import com.olivepress.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Mappers mappers;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       UserRepository userRepository, PasswordEncoder passwordEncoder,
                       Mappers mappers, AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mappers = mappers;
        this.auditService = auditService;
    }

    @Transactional
    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username().trim(), request.password()));
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        if (!principal.isEnabled()) {
            throw new BusinessException("Compte desactive. Contactez l'administrateur.");
        }
        String token = jwtService.generateToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);
        auditService.log(principal.getUser(), "LOGIN", "USER", principal.getId(),
                "Connexion de " + principal.getFullName());
        return new AuthDtos.LoginResponse(token, refreshToken, mappers.toUserDto(principal.getUser()));
    }

    @Transactional
    public AuthDtos.LoginResponse refresh(String refreshToken) {
        if (!jwtService.isValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new BusinessException("Refresh token invalide ou expire");
        }
        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        if (!user.isActive()) {
            throw new BusinessException("Compte desactive. Contactez l'administrateur.");
        }
        UserPrincipal principal = new UserPrincipal(user);
        return new AuthDtos.LoginResponse(
                jwtService.generateToken(principal),
                jwtService.generateRefreshToken(principal),
                mappers.toUserDto(user));
    }

    @Transactional
    public void changePassword(User user, AuthDtos.ChangePasswordRequest req) {
        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable: " + user.getId()));
        if (!passwordEncoder.matches(req.currentPassword(), managed.getPasswordHash())) {
            throw new BusinessException("Mot de passe actuel incorrect");
        }
        validatePasswordStrength(req.newPassword());
        if (passwordEncoder.matches(req.newPassword(), managed.getPasswordHash())) {
            throw new BusinessException("Le nouveau mot de passe doit etre different de l'actuel");
        }
        managed.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(managed);
        auditService.log(managed, "CHANGE_PASSWORD", "USER", managed.getId(), "Mot de passe modifie");
    }

    public static Set<Permission> defaultEmployeePermissions() {
        return new HashSet<>(Set.of(
                Permission.CLIENT_READ,
                Permission.APPORT_READ, Permission.APPORT_WRITE,
                Permission.PRODUCTION_READ, Permission.PRODUCTION_WRITE,
                Permission.STOCK_READ,
                Permission.LIVRAISON_READ,
                Permission.FACTURE_READ,
                Permission.NOTIFICATION_READ,
                Permission.HISTORY_READ));
    }

    public static Set<Permission> allPermissions() {
        return new HashSet<>(Set.of(Permission.values()));
    }

    public static void validatePasswordStrength(String raw) {
        if (raw == null || raw.length() < 6) {
            throw new BusinessException("Le mot de passe doit contenir au moins 6 caracteres");
        }
    }

    public static void validateRolePermissions(Role role, Set<Permission> permissions) {
        // Aucune contrainte forte : l'ADMIN a tout par definition (voir User.hasPermission).
        if (role == Role.ADMIN && permissions != null) {
            permissions.clear(); // l'admin n'a pas besoin de permissions explicites
        }
    }
}
