package com.olivepress.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Parametres applicatifs cles/valeurs (tarif de pressage, etc.).
 */
@Entity
@Table(name = "settings")
public class Setting {

    public static final String TARIF_PRESSION_KG = "TARIF_PRESSION_KG";

    @Id
    @Column(name = "setting_key", nullable = false, length = 60)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 200)
    private String value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
