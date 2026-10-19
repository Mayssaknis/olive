package com.olivepress.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Empeche le demarrage en production avec des secrets par defaut.
 * "Production" = datasource non-H2 (PostgreSQL). En local (H2) on se contente d'avertir.
 */
@Component
public class SecurityStartupValidator {

    private static final Logger log = LoggerFactory.getLogger(SecurityStartupValidator.class);
    private static final String DEFAULT_JWT_SECRET =
            "change-moi-cette-cle-secrete-en-production-64-caracteres-minimum-!!";
    private static final String DEFAULT_ADMIN_PASSWORD = "admin1234";
    private static final int MIN_SECRET_LENGTH = 32;

    private final String jwtSecret;
    private final String datasourceUrl;
    private final String adminPassword;

    public SecurityStartupValidator(
            @Value("${olivepress.jwt.secret:}") String jwtSecret,
            @Value("${spring.datasource.url:}") String datasourceUrl,
            @Value("${olivepress.admin.password:}") String adminPassword) {
        this.jwtSecret = jwtSecret;
        this.datasourceUrl = datasourceUrl;
        this.adminPassword = adminPassword;
    }

    @PostConstruct
    public void validate() {
        boolean production = datasourceUrl != null && !datasourceUrl.startsWith("jdbc:h2");

        boolean defaultSecret = jwtSecret == null || jwtSecret.isBlank() || DEFAULT_JWT_SECRET.equals(jwtSecret);
        if (defaultSecret) {
            if (production) {
                throw new IllegalStateException(
                        "OLIVEPRESS_JWT_SECRET doit etre defini (valeur par defaut interdite en production).");
            }
            log.warn("Secret JWT par defaut utilise : definissez OLIVEPRESS_JWT_SECRET avant la mise en production.");
        } else if (jwtSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "OLIVEPRESS_JWT_SECRET doit contenir au moins " + MIN_SECRET_LENGTH + " caracteres.");
        }

        if (production && DEFAULT_ADMIN_PASSWORD.equals(adminPassword)) {
            log.warn("OLIVEPRESS_ADMIN_PASSWORD est encore la valeur par defaut : changez-la.");
        }
    }
}
