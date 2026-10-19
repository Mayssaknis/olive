package com.olivepress.security;

import com.olivepress.domain.Permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Verifie qu'un utilisateur authentifie possede la permission requise.
 * Applique cote serveur (pas seulement en masquant des boutons dans l'UI).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    Permission value();
}
