package com.olivepress.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "apports", indexes = {
        @Index(name = "idx_apports_client", columnList = "client_id"),
        @Index(name = "idx_apports_status", columnList = "status"),
        @Index(name = "idx_apports_date", columnList = "received_at")
})
public class Apport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Numero d'apport genere automatiquement (ex: AP-2026-000123). */
    @Column(name = "numero", nullable = false, unique = true, length = 30)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt = Instant.now();

    /** Poids brut en kg. */
    @Column(name = "gross_weight_kg", nullable = false, precision = 12, scale = 3)
    private BigDecimal grossWeightKg;

    /** Tare en kg (facultative, 0 par defaut). */
    @Column(name = "tare_kg", nullable = false, precision = 12, scale = 3)
    private BigDecimal tareKg = BigDecimal.ZERO;

    /** Poids net = brut - tare (recalcule a chaque modification). */
    @Column(name = "net_weight_kg", nullable = false, precision = 12, scale = 3)
    private BigDecimal netWeightKg;

    @Column(name = "ticket_number", length = 40)
    private String ticketNumber;

    @Column(length = 500)
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private User employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApportStatus status = ApportStatus.RECU;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    public void recalculateNetWeight() {
        BigDecimal tare = tareKg == null ? BigDecimal.ZERO : tareKg;
        this.netWeightKg = grossWeightKg.subtract(tare);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }
    public BigDecimal getGrossWeightKg() { return grossWeightKg; }
    public void setGrossWeightKg(BigDecimal grossWeightKg) { this.grossWeightKg = grossWeightKg; }
    public BigDecimal getTareKg() { return tareKg; }
    public void setTareKg(BigDecimal tareKg) { this.tareKg = tareKg; }
    public BigDecimal getNetWeightKg() { return netWeightKg; }
    public void setNetWeightKg(BigDecimal netWeightKg) { this.netWeightKg = netWeightKg; }
    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }
    public ApportStatus getStatus() { return status; }
    public void setStatus(ApportStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
