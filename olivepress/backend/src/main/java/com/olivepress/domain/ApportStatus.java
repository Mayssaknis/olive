package com.olivepress.domain;

/**
 * Etapes du circuit d'un apport d'olives.
 */
public enum ApportStatus {
    RECU("Reçu"),
    EN_ATTENTE("En attente"),
    TRI("Tri"),
    PRESSAGE("Pressage"),
    PRODUCTION_TERMINEE("Production terminée"),
    STOCKAGE("Stockage"),
    LIVRAISON("Livraison"),
    CLOTURE("Clôturé"),
    ANOMALIE("Anomalie");

    private final String label;

    ApportStatus(String label) { this.label = label; }

    public String getLabel() { return label; }
}
