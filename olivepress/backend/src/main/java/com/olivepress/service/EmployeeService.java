package com.olivepress.service;

import com.olivepress.domain.Role;
import com.olivepress.domain.User;
import com.olivepress.dto.AuthDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.exception.BusinessException;
import com.olivepress.exception.NotFoundException;
import com.olivepress.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class EmployeeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Mappers mappers;
    private final AuditService auditService;

    public EmployeeService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           Mappers mappers, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mappers = mappers;
        this.auditService = auditService;
    }

    public List<AuthDtos.UserDto> list() {
        return userRepository.findAllByOrderByFullNameAsc().stream().map(mappers::toUserDto).toList();
    }

    public User require(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable: " + id));
    }

    @Transactional
    public AuthDtos.UserDto create(AuthDtos.UserCreateRequest req, User actor) {
        if (userRepository.existsByUsername(req.username().trim())) {
            throw new BusinessException("Nom d'utilisateur deja utilise");
        }
        if (userRepository.existsByEmail(req.email().trim())) {
            throw new BusinessException("Email deja utilise");
        }
        AuthService.validatePasswordStrength(req.password());

        User u = new User();
        u.setUsername(req.username().trim());
        u.setEmail(req.email().trim());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setFullName(req.fullName().trim());
        u.setPhone(req.phone());
        Role role = req.role() == null ? Role.EMPLOYEE : req.role();
        u.setRole(role);
        Set<com.olivepress.domain.Permission> perms =
                req.permissions() == null ? AuthService.defaultEmployeePermissions() : req.permissions();
        AuthService.validateRolePermissions(role, perms);
        u.setPermissions(perms);
        u.setActive(req.active() == null || req.active());

        User saved = userRepository.save(u);
        auditService.log(actor, "CREATE", "USER", saved.getId(),
                "Nouvel employe " + saved.getFullName() + " (" + saved.getRole() + ")");
        return mappers.toUserDto(saved);
    }

    @Transactional
    public AuthDtos.UserDto update(Long id, AuthDtos.UserUpdateRequest req, User actor) {
        User u = require(id);
        if (req.email() != null) u.setEmail(req.email().trim());
        if (req.fullName() != null) u.setFullName(req.fullName().trim());
        if (req.phone() != null) u.setPhone(req.phone());
        if (req.role() != null) u.setRole(req.role());
        if (req.permissions() != null) {
            Set<com.olivepress.domain.Permission> perms = req.permissions();
            AuthService.validateRolePermissions(u.getRole(), perms);
            u.setPermissions(perms);
        }
        if (req.active() != null) u.setActive(req.active());
        if (req.password() != null && !req.password().isBlank()) {
            AuthService.validatePasswordStrength(req.password());
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        User saved = userRepository.save(u);
        auditService.log(actor, "UPDATE", "USER", saved.getId(), "Maj employe " + saved.getFullName());
        return mappers.toUserDto(saved);
    }

    @Transactional
    public AuthDtos.UserDto toggleActive(Long id, User actor) {
        User u = require(id);
        u.setActive(!u.isActive());
        User saved = userRepository.save(u);
        auditService.log(actor, "TOGGLE", "USER", saved.getId(),
                (saved.isActive() ? "Activation" : "Desactivation") + " de " + saved.getFullName());
        return mappers.toUserDto(saved);
    }
}
