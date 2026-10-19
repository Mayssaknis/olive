package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.DashboardDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/historique")
public class HistoryController {

    private final AuditService auditService;

    public HistoryController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @RequirePermission(Permission.HISTORY_READ)
    public Page<DashboardDtos.HistoryDto> history(@RequestParam(required = false) Long userId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "30") int size) {
        return auditService.history(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }
}
