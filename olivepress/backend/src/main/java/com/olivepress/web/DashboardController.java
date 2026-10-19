package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.DashboardDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @RequirePermission(Permission.DASHBOARD_READ)
    public DashboardDtos.DashboardDto dashboard() {
        return dashboardService.build();
    }
}
