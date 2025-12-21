package com.tranan.authservice.infrastructure.config.network;

import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RefreshTokenRedisService {

    private final RedisTemplate<String, SessionMeta> redisSessionMetaTemplate;

    private String buildKey(String token, String userId) {
        return "auth::refresh_token:" + userId + ":" + DigestUtils.sha256Hex(token);
    }

    // SỬA ĐỔI: Nhận tham số rời thay vì DTO
    public void saveRefreshToken(
            String token,
            String userId,
            String deviceName,
            String deviceType,
            String userAgent,
            Duration expire
    ) {
        String sessionId = buildKey(token, userId);

        SessionMeta sessionMeta = new SessionMeta(
                sessionId,
                deviceName,
                deviceType,
                userAgent,
                Instant.now()
        );

        redisSessionMetaTemplate.opsForValue().set(sessionId, sessionMeta, expire);
    }

    public boolean validateToken(String token, String userId) {
        return redisSessionMetaTemplate.hasKey(buildKey(token, userId));
    }

    public void deleteRefreshToken(String token, String userId) {
        redisSessionMetaTemplate.delete(buildKey(token, userId));
    }

    public boolean isSessionOwner(String sessionId, String userId) {
        if (sessionId == null || userId == null) return false;

        // Kiểm tra an toàn: Key Redis thường có dạng "...:userId:..."
        // Ta thêm dấu ":" bao quanh userId để tránh nhầm lẫn (ví dụ user 1 trùng với user 10, 100)
        return sessionId.contains(":" + userId + ":");
    }

    // 2. Hàm xóa theo Key (đã có từ trước hoặc thêm mới)
    public void deleteRefreshTokenByKey(String sessionId) {
        redisSessionMetaTemplate.delete(sessionId);
    }

    // SỬA ĐỔI: Trả về List<SessionMeta> (Raw Data), không trả về DTO
    public List<SessionMeta> getAllSessionMetas(String userId) {
        String keyPattern = "auth::refresh_token:" + userId + ":*";
        Set<String> keys = redisSessionMetaTemplate.keys(keyPattern);

        if (keys == null || keys.isEmpty()) return Collections.emptyList();

        List<SessionMeta> sessionMetas = new ArrayList<>();
        for (String key : keys) {
            SessionMeta meta = redisSessionMetaTemplate.opsForValue().get(key);
            if (meta != null) {
                sessionMetas.add(meta);
            }
        }
        return sessionMetas;
    }
}
