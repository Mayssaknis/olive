package com.olivepress.repository;

import com.olivepress.domain.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    Page<StockMovement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(m.quantityL),0) FROM StockMovement m WHERE m.movementType IN ('ENTREE','AJUSTEMENT_POSITIF')")
    BigDecimal sumIn();

    @Query("SELECT COALESCE(SUM(m.quantityL),0) FROM StockMovement m WHERE m.movementType IN ('SORTIE','AJUSTEMENT_NEGATIF')")
    BigDecimal sumOut();

    default BigDecimal availableStock() {
        BigDecimal in = sumIn();
        BigDecimal out = sumOut();
        return (in == null ? BigDecimal.ZERO : in).subtract(out == null ? BigDecimal.ZERO : out);
    }
}
