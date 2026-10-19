package com.olivepress.repository;

import com.olivepress.domain.Livraison;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

public interface LivraisonRepository extends JpaRepository<Livraison, Long> {

    @Query("""
            SELECT l FROM Livraison l
            WHERE (:clientId IS NULL OR l.client.id = :clientId)
              AND l.deliveredAt >= COALESCE(:from, l.deliveredAt)
              AND l.deliveredAt <= COALESCE(:to, l.deliveredAt)
            ORDER BY l.deliveredAt DESC
            """)
    Page<Livraison> search(@Param("clientId") Long clientId,
                           @Param("from") Instant from,
                           @Param("to") Instant to,
                           Pageable pageable);

    java.util.List<Livraison> findByClientIdOrderByDeliveredAtDesc(Long clientId);
}
