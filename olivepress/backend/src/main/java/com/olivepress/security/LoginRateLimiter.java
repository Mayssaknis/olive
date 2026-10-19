package com.olivepress.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limiteur de tentatives de connexion en memoire (fenetre glissante par cle, generalement l'IP).
 * Protege /api/auth/login contre le brute-force. Desactive si maxAttempts <= 0.
 */
@Component
public class LoginRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimiter.class);
    private static final int MAX_TRACKED_KEYS = 10_000;

    private final int maxAttempts;
    private final long windowMs;
    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${olivepress.security.login.max-attempts:5}") int maxAttempts,
            @Value("${olivepress.security.login.window-minutes:15}") long windowMinutes) {
        this.maxAttempts = maxAttempts;
        this.windowMs = Math.max(1, windowMinutes) * 60_000L;
    }

    public boolean isEnabled() {
        return maxAttempts > 0;
    }

    /** true si la cle a atteint le quota sur la fenetre glissante. */
    public boolean isBlocked(String key) {
        if (!isEnabled()) return false;
        Deque<Long> q = attempts.get(key);
        if (q == null) return false;
        synchronized (q) {
            prune(q);
            return q.size() >= maxAttempts;
        }
    }

    public void recordFailure(String key) {
        if (!isEnabled()) return;
        if (attempts.size() > MAX_TRACKED_KEYS) evictStale();
        Deque<Long> q = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            prune(q);
            q.addLast(System.currentTimeMillis());
        }
    }

    public void reset(String key) {
        attempts.remove(key);
    }

    /** Secondes avant liberation d'un nouveau creneau (indicatif, pour Retry-After). */
    public long retryAfterSeconds(String key) {
        Deque<Long> q = attempts.get(key);
        if (q == null) return 0;
        synchronized (q) {
            Long oldest = q.peekFirst();
            if (oldest == null) return 0;
            long elapsed = System.currentTimeMillis() - oldest;
            return Math.max(1, (windowMs - elapsed + 999) / 1000);
        }
    }

    private void prune(Deque<Long> q) {
        long cutoff = System.currentTimeMillis() - windowMs;
        while (!q.isEmpty() && q.peekFirst() < cutoff) {
            q.pollFirst();
        }
    }

    private void evictStale() {
        Iterator<Map.Entry<String, Deque<Long>>> it = attempts.entrySet().iterator();
        while (it.hasNext()) {
            Deque<Long> q = it.next().getValue();
            synchronized (q) {
                prune(q);
                if (q.isEmpty()) it.remove();
            }
        }
        log.warn("LoginRateLimiter : eviction des cles expirees (suivi > {})", MAX_TRACKED_KEYS);
    }
}
