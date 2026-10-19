package com.olivepress.repository;

import com.olivepress.domain.Apport;
import com.olivepress.domain.ApportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ApportRepository extends JpaRepository<Apport, Long> {

    Optional<Apport> findByNumero(String numero);

    @Query("""
            SELECT a FROM Apport a
            WHERE (:clientId IS NULL OR a.client.id = :clientId)
              AND (:status IS NULL OR a.status = :status)
              AND a.receivedAt >= COALESCE(:from, a.receivedAt)
              AND a.receivedAt <= COALESCE(:to, a.receivedAt)
              AND (:query IS NULL OR :query = ''
                   OR LOWER(a.numero) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(CONCAT(a.client.firstName, ' ', a.client.lastName)) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY a.receivedAt DESC
            """)
    Page<Apport> search(@Param("query") String query,
                         @Param("clientId") Long clientId,
                         @Param("status") ApportStatus status,
                         @Param("from") Instant from,
                         @Param("to") Instant to,
                         Pageable pageable);

    List<Apport> findByClientIdOrderByReceivedAtDesc(Long clientId);

    List<Apport> findTop10ByOrderByReceivedAtDesc();

    long countByReceivedAtBetween(Instant from, Instant to);

    @Query("SELECT COALESCE(SUM(a.netWeightKg),0) FROM Apport a WHERE a.receivedAt BETWEEN :from AND :to")
    java.math.BigDecimal sumNetWeightBetween(@Param("from") Instant from, @Param("to") Instant to);

    long countByStatusIn(List<ApportStatus> statuses);

    List<Apport> findByStatusInOrderByReceivedAtAsc(List<ApportStatus> statuses);

    long count();
}
