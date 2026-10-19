package com.olivepress.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Applique {@link LoginRateLimiter} sur POST /api/auth/login : renvoie 429 quand le quota
 * d'echecs est depasse, et comptabilise les echecs (401) / reinitialise apres un succes.
 */
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final LoginRateLimiter limiter;

    public LoginRateLimitFilter(LoginRateLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !limiter.isEnabled()
                || !"POST".equalsIgnoreCase(request.getMethod())
                || !"/api/auth/login".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String key = clientKey(request);

        if (limiter.isBlocked(key)) {
            long retry = limiter.retryAfterSeconds(key);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retry));
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":"
                            + "\"Trop de tentatives de connexion. Reessayez dans " + retry + " s.\"}");
            return;
        }

        filterChain.doFilter(request, response);

        if (response.getStatus() == 401) {
            limiter.recordFailure(key);
        } else if (response.getStatus() < 400) {
            limiter.reset(key);
        }
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
