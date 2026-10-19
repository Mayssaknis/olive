package com.olivepress.service;

import com.olivepress.domain.AppNotification;
import com.olivepress.repository.AppNotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final AppNotificationRepository repository;
    private final PushNotificationService pushService;

    public NotificationService(AppNotificationRepository repository, PushNotificationService pushService) {
        this.repository = repository;
        this.pushService = pushService;
    }

    /** Notifie l'administrateur (user null = destinataire global admin). */
    public void notifyAdmins(String title, String message, AppNotification.Type type,
                             String entityType, Long entityId) {
        AppNotification n = new AppNotification();
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        repository.save(n);
        pushService.sendToAll(title, message, type.name(), entityId);
    }

    public List<AppNotification> forUser(Long userId) {
        return repository.findForUser(userId);
    }

    public Page<AppNotification> forUser(Long userId, Pageable pageable) {
        return repository.findForUser(userId, pageable);
    }

    public long unreadCount(Long userId) {
        return repository.countUnreadForUser(userId);
    }

    public AppNotification markRead(Long id) {
        AppNotification n = repository.findById(id)
                .orElseThrow(() -> new com.olivepress.exception.NotFoundException("Notification introuvable"));
        n.setReadFlag(true);
        return repository.save(n);
    }

    public void markAllRead(Long userId) {
        repository.findForUser(userId).forEach(n -> {
            if (!n.isReadFlag()) {
                n.setReadFlag(true);
                repository.save(n);
            }
        });
    }
}
