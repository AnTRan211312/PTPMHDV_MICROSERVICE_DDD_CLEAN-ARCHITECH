package com.tranan.authservice.infrastructure.config.security;

import com.tranan.authservice.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm; // Import cái này cho chuẩn
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TokenProvider {

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder; // Cần thiết cho việc logout (extract subject)

    @Value("${app.environment:development}")
    private String environment;

    @Value("${jwt.access-token-expiration}")
    private Long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private Long refreshTokenExpiration;

    // ========================================================================
    // 1. PUBLIC METHODS (Logic nghiệp vụ gọi vào đây)
    // ========================================================================

    public String createAccessToken(User user) {
        // Chuẩn bị các Claims riêng biệt cho Access Token
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole() != null ? user.getRole().getRoleName() : "");

        List<String> permissions = List.of();
        if (user.getRole() != null && user.getRole().getPermissions() != null) {
            permissions = user.getRole().getPermissions().stream()
                    .map(p -> p.getMethod() + " " + p.getApiPath())
                    .collect(Collectors.toList());
        }
        claims.put("permissions", permissions);

        // Gọi hàm chung
        return generateToken(user.getEmail(), claims, accessTokenExpiration);
    }

    public String createRefreshToken(User user) {
        // Refresh token không cần claims phụ, chỉ cần subject
        return generateToken(user.getEmail(), Collections.emptyMap(), refreshTokenExpiration);
    }

    public ResponseCookie buildRefreshCookie(String refreshToken) {
        return buildCookie("refresh_token", refreshToken, refreshTokenExpiration);
    }

    public ResponseCookie getCleanCookie() {
        return buildCookie("refresh_token", "", 0L);
    }

    // Hàm extract Subject (email) từ token string (dùng cho Logout)
    public String extractSubject(String token) {
        try {
            return jwtDecoder.decode(token).getSubject();
        } catch (JwtException e) {
            return null;
        }
    }

    // ========================================================================
    // 2. PRIVATE HELPER METHODS (Logic tái sử dụng nằm ở đây)
    // ========================================================================

    // Hàm GENERIC để tạo bất kỳ loại token nào
    private String generateToken(String subject, Map<String, Object> extraClaims, Long expirationTime) {
        Instant now = Instant.now();
        Instant validity = now.plus(expirationTime, ChronoUnit.SECONDS);

        // Khởi tạo Builder với các claim cơ bản
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(subject);

        // Nhồi thêm các claim phụ (nếu có)
        extraClaims.forEach(claimsBuilder::claim);

        // Cũ: JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();

        // Ký token
        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS512).build(); // Hoặc thuật toán bạn cấu hình
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claimsBuilder.build())).getTokenValue();
    }

    // Hàm GENERIC để tạo Cookie (Tránh lặp logic check Prod/Dev)
    private ResponseCookie buildCookie(String name, String value, Long maxAge) {
        ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie
                .from(name, value)
                .httpOnly(true)
                .path("/")
                .maxAge(maxAge);

        if ("production".equalsIgnoreCase(environment)) {
            cookieBuilder.sameSite("None").secure(true);
        } else {
            cookieBuilder.sameSite("Lax");
        }

        return cookieBuilder.build();
    }
}