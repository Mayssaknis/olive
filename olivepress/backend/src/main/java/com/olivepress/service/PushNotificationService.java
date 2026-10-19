package com.olivepress.service;

import com.olivepress.domain.PushToken;
import com.olivepress.domain.User;
import com.olivepress.repository.PushTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final PushTokenRepository repository;
    private final boolean enabled;
    private final RestClient http = RestClient.create();

    public PushNotificationService(PushTokenRepository repository,
                                   @Value("${olivepress.push.enabled:false}") boolean enabled) {
        this.repository = repository;
        this.enabled = enabled;
    }

    /** Enregistre (ou met a jour) un jeton push pour l'utilisateur connecte. */
    @Transactional
    public void register(String token, String platform, User user) {
        PushToken entity = repository.findByToken(token).orElseGet(PushToken::new);
        entity.setToken(token);
        entity.setPlatform(platform);
        entity.setUser(user);
        repository.save(entity);
    }

    @Transactional
    public void unregister(String token) {
        repository.findByToken(token).ifPresent(repository::delete);
    }

    /** Envoie une notification push a tous les appareils enregistres (non bloquant). */
    @Async
    public void sendToAll(String title, String body, String type, Long entityId) {
        if (!enabled) {
            return;
        }
        List<String> tokens = repository.findAllByOrderByCreatedAtDesc().stream()
                .map(PushToken::getToken)
                .distinct()
                .toList();
        for (String token : tokens) {
            sendOne(token, title, body, type, entityId);
        }
    }

    private void sendOne(String token, String title, String body, String type, Long entityId) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("to", token);
            message.put("title", title);
            message.put("body", body);
            message.put("sound", "default");
            if (type != null) {
                message.put("data", Map.of("type", type, "entityId", entityId == null ? "" : entityId));
            }
            http.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(message)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Echec d'envoi du push vers Expo: {}", e.getMessage());
        }
    }
}
