package com.olivepress.repository;

import com.olivepress.domain.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByFactureIdOrderByPaidAtDesc(Long factureId);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Paiement p WHERE p.facture.id = :factureId")
    BigDecimal sumByFacture(Long factureId);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Paiement p")
    BigDecimal sumAll();
}
