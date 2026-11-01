package com.saes.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Jeton de connexion. Il porte l'identifiant de l'utilisateur, qui ne change
 * jamais (et non son e-mail, qu'il peut modifier dans « Gerer son compte »).
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final Duration expiration;

    public JwtService(
            @Value("${saes.jwt.secret}") String secret,
            @Value("${saes.jwt.expiration-minutes}") long expirationMinutes) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    public String generate(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration.toMillis());
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Identifiant de l'utilisateur porte par le jeton. Leve JwtException si le
     * jeton est invalide ou expire, et IllegalArgumentException (NumberFormatException)
     * s'il est d'un ancien format.
     */
    public Long userId(String token) throws JwtException {
        String subject = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Long.valueOf(subject);
    }
}
