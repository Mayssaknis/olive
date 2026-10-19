package com.olivepress.repository;

import com.olivepress.domain.Facture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;

public interface FactureRepository extends JpaRepository<Facture, Long> {

    @Query("""
            SELECT f FROM Facture f
            WHERE (:clientId IS NULL OR f.client.id = :clientId)
              AND (:statut IS NULL OR f.statut = :statut)
              AND (:from IS NULL OR f.invoiceDate >= :from)
              AND (:to IS NULL OR f.invoiceDate <= :to)
            ORDER BY f.invoiceDate DESC
            """)
    Page<Facture> search(@Param("clientId") Long clientId,
                         @Param("statut") Facture.Statut statut,
                         @Param("from") LocalDate from,
                         @Param("to") LocalDate to,
                         Pageable pageable);

    java.util.List<Facture> findByClientIdOrderByInvoiceDateDesc(Long clientId);

    java.util.Optional<Facture> findByApportId(Long apportId);

    @Query("SELECT COALESCE(SUM(f.totalAmount),0) FROM Facture f")
    java.math.BigDecimal sumTotal();

    @Query("SELECT COALESCE(SUM(f.totalAmount),0) FROM Facture f WHERE f.statut <> 'PAYEE'")
    java.math.BigDecimal sumOutstanding();

    @Query("SELECT f FROM Facture f WHERE f.statut <> 'PAYEE' ORDER BY f.invoiceDate ASC")
    java.util.List<Facture> findUnpaid();
}
