package com.olivepress.repository;

import com.olivepress.domain.ApportStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApportStatusHistoryRepository extends JpaRepository<ApportStatusHistory, Long> {
    List<ApportStatusHistory> findByApportIdOrderByChangedAtAsc(Long apportId);
}
