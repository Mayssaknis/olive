package com.olivepress.repository;

import com.olivepress.domain.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Long> {

    @Query("""
            SELECT c FROM Client c
            WHERE (:query IS NULL OR :query = ''
                   OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR c.phone LIKE CONCAT('%', :query, '%'))
              AND (:active IS NULL OR c.active = :active)
            ORDER BY c.lastName ASC, c.firstName ASC
            """)
    List<Client> search(@Param("query") String query, @Param("active") Boolean active);

    @Query("""
            SELECT c FROM Client c
            WHERE (:query IS NULL OR :query = ''
                   OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR c.phone LIKE CONCAT('%', :query, '%'))
              AND (:active IS NULL OR c.active = :active)
            ORDER BY c.lastName ASC, c.firstName ASC
            """)
    Page<Client> searchPage(@Param("query") String query, @Param("active") Boolean active, Pageable pageable);

    List<Client> findAllByOrderByLastNameAscFirstNameAsc();

    long countByCreatedAtAfter(java.time.Instant instant);
}
