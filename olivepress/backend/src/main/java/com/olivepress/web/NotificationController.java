package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.DashboardDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final Mappers mappers;

    public NotificationController(NotificationService notificationService, Mappers mappers) {
        this.notificationService = notificationService;
        this.mappers = mappers;
    }

    @GetMapping
    @RequirePermission(Permission.NOTIFICATION_READ)
    public Page<DashboardDtos.NotificationDto> list(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return notificationService
                .forUser(SecurityUtils.currentUserId(), PageRequest.of(page, size))
                .map(mappers::toNotificationDto);
    }

    @GetMapping("/unread-count")
    @RequirePermission(Permission.NOTIFICATION_READ)
    public long unreadCount() {
        return notificationService.unreadCount(SecurityUtils.currentUserId());
    }

    @PatchMapping("/{id}/read")
    @RequirePermission(Permission.NOTIFICATION_READ)
    public DashboardDtos.NotificationDto markRead(@PathVariable Long id) {
        return mappers.toNotificationDto(notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    @RequirePermission(Permission.NOTIFICATION_READ)
    public void markAllRead() {
        notificationService.markAllRead(SecurityUtils.currentUserId());
    }
}
