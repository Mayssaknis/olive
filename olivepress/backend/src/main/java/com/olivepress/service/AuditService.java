package com.olivepress.service;

import com.olivepress.domain.AuditLog;
import com.olivepress.domain.User;
import com.olivepress.dto.DashboardDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final Mappers mappers;

    public AuditService(AuditLogRepository auditLogRepository, Mappers mappers) {
        this.auditLogRepository = auditLogRepository;
        this.mappers = mappers;
    }

    public void log(User user, String action, String entityType, Long entityId, String details) {
        auditLogRepository.save(AuditLog.of(user, action, entityType, entityId, details));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<DashboardDtos.HistoryDto> history(Long userId, Pageable pageable) {
        Page<AuditLog> page = userId != null
                ? auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                : auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(mappers::toHistoryDto);
    }
}
