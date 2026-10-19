package com.olivepress.repository;

import com.olivepress.domain.AppNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

    @Query("SELECT n FROM AppNotification n WHERE n.user IS NULL OR n.user.id = :userId ORDER BY n.createdAt DESC")
    List<AppNotification> findForUser(@Param("userId") Long userId);

    @Query("SELECT n FROM AppNotification n WHERE n.user IS NULL OR n.user.id = :userId ORDER BY n.createdAt DESC")
    Page<AppNotification> findForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM AppNotification n WHERE (n.user IS NULL OR n.user.id = :userId) AND n.readFlag = false")
    long countUnreadForUser(@Param("userId") Long userId);
}
