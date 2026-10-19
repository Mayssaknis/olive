package com.olivepress.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Enregistrement de production : olives traitees + huile obtenue -> rendement calcule.
 */
@Entity
@Table(name = "production_records")
public class ProductionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apport_id", nullable = false)
    private Apport apport;

    /** Quantite d'olives reellement traitees (kg). */
    @Column(name = "olives_processed_kg", nullable = false, precision = 12, scale = 3)
    private BigDecimal olivesProcessedKg;

    /** Quantite d'huile obtenue (litres). */
    @Column(name = "oil_obtained_l", nullable = false, precision = 12, scale = 3)
    private BigDecimal oilObtainedL;

    /** Rendement (%) = huile / olives * 100. */
    @Column(name = "yield_percent", nullable = false, precision = 8, scale = 3)
    private BigDecimal yieldPercent;

    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private User employee;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private java.time.Instant createdAt = java.time.Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Apport getApport() { return apport; }
    public void setApport(Apport apport) { this.apport = apport; }
    public BigDecimal getOlivesProcessedKg() { return olivesProcessedKg; }
    public void setOlivesProcessedKg(BigDecimal olivesProcessedKg) { this.olivesProcessedKg = olivesProcessedKg; }
    public BigDecimal getOilObtainedL() { return oilObtainedL; }
    public void setOilObtainedL(BigDecimal oilObtainedL) { this.oilObtainedL = oilObtainedL; }
    public BigDecimal getYieldPercent() { return yieldPercent; }
    public void setYieldPercent(BigDecimal yieldPercent) { this.yieldPercent = yieldPercent; }
    public LocalDate getProductionDate() { return productionDate; }
    public void setProductionDate(LocalDate productionDate) { this.productionDate = productionDate; }
    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.Instant createdAt) { this.createdAt = createdAt; }
}
