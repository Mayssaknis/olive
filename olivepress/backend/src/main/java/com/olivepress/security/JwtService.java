package com.olivepress.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtService(
            @Value("${olivepress.jwt.secret}") String secret,
            @Value("${olivepress.jwt.expiration-ms:28800000}") long expirationMs,
            @Value("${olivepress.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(UserPrincipal principal) {
        return buildToken(principal, TYPE_ACCESS, expirationMs);
    }

    public String generateRefreshToken(UserPrincipal principal) {
        return buildToken(principal, TYPE_REFRESH, refreshExpirationMs);
    }

    private String buildToken(UserPrincipal principal, String type, long ttlMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getId())
                .claim("typ", type)
                .claim("role", principal.getRole().name())
                .claim("name", principal.getFullName())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttlMs))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    /**
     * Un token d'acces doit porter typ=access. Les tokens historiques (sans claim typ)
     * sont acceptes comme access pour ne pas invalider les sessions existantes.
     */
    public boolean isAccessToken(String token) {
        String type = parse(token).get("typ", String.class);
        return type == null || TYPE_ACCESS.equals(type);
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(parse(token).get("typ", String.class));
    }

    public boolean isValid(String token) {
        try {
            return parse(token).getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }

    public long getExpirationMs() { return expirationMs; }

    public long getRefreshExpirationMs() { return refreshExpirationMs; }
}
