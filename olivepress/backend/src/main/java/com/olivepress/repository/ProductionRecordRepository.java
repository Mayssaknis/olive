package com.olivepress.repository;

import com.olivepress.domain.ProductionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ProductionRecordRepository extends JpaRepository<ProductionRecord, Long> {

    List<ProductionRecord> findByApportIdOrderByCreatedAtDesc(Long apportId);

    @Query("SELECT COALESCE(SUM(p.oilObtainedL),0) FROM ProductionRecord p")
    java.math.BigDecimal sumOilObtained();

    @Query("SELECT COALESCE(SUM(p.olivesProcessedKg),0) FROM ProductionRecord p WHERE p.productionDate BETWEEN :from AND :to")
    java.math.BigDecimal sumOlivesProcessedBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(p.oilObtainedL),0) FROM ProductionRecord p WHERE p.productionDate BETWEEN :from AND :to")
    java.math.BigDecimal sumOilObtainedBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT p FROM ProductionRecord p WHERE p.productionDate >= :from ORDER BY p.productionDate ASC")
    java.util.List<ProductionRecord> findSince(@Param("from") LocalDate from);
}
