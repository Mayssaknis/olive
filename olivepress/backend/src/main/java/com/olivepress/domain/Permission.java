package com.olivepress.domain;

/**
 * Permissions métier. Verifiees cote serveur via @RequirePermission.
 */
public enum Permission {
    DASHBOARD_READ,
    CLIENT_READ,
    CLIENT_WRITE,
    APPORT_READ,
    APPORT_WRITE,
    PRODUCTION_READ,
    PRODUCTION_WRITE,
    STOCK_READ,
    STOCK_WRITE,
    LIVRAISON_READ,
    LIVRAISON_WRITE,
    FACTURE_READ,
    FACTURE_WRITE,
    EMPLOYEE_READ,
    EMPLOYEE_WRITE,
    NOTIFICATION_READ,
    HISTORY_READ,
    REPORT_READ,
    SETTING_WRITE
}
