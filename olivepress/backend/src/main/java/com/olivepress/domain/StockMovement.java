package com.olivepress.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Mouvement de stock d'huile. Le stock disponible = somme des entrees - sorties + ajustements.
 */
@Entity
@Table(name = "stock_movements", indexes = @Index(name = "idx_stock_date", columnList = "created_at"))
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    /** Quantite en litres (toujours positive ; le sens est donne par le type). */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityL;

    @Column(name = "lot_number", length = 40)
    private String lotNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "reason", length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public BigDecimal signedQuantity() {
        return switch (movementType) {
            case ENTREE, AJUSTEMENT_POSITIF -> quantityL;
            case SORTIE, AJUSTEMENT_NEGATIF -> quantityL.negate();
        };
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MovementType getMovementType() { return movementType; }
    public void setMovementType(MovementType movementType) { this.movementType = movementType; }
    public BigDecimal getQuantityL() { return quantityL; }
    public void setQuantityL(BigDecimal quantityL) { this.quantityL = quantityL; }
    public String getLotNumber() { return lotNumber; }
    public void setLotNumber(String lotNumber) { this.lotNumber = lotNumber; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
