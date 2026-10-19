package com.olivepress.security;

import com.olivepress.domain.User;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal currentPrincipal() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal up) {
            return up;
        }
        throw new IllegalStateException("Aucun utilisateur authentifie");
    }

    public static User currentUser() {
        return currentPrincipal().getUser();
    }

    public static Long currentUserId() {
        return currentPrincipal().getId();
    }
}
