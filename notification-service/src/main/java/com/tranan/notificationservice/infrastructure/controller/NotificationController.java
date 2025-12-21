package com.tranan.notificationservice.infrastructure.controller;

import com.tranan.notificationservice.application.service.NotificationService;
import com.tranan.notificationservice.domain.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    // ========== USER NOTIFICATIONS ==========

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            @PageableDefault(size = 10) Pageable pageable) {

        Long userId = getCurrentUserId();
        log.info("[NotificationController] Fetching notifications for userId: {}", userId);

        Page<Notification> page = notificationService.getUserNotifications(userId, pageable);
        long unreadCount = notificationService.getUnreadCount(userId);

        log.info("[NotificationController] Found {} notifications, {} unread for userId: {}",
                page.getTotalElements(), unreadCount, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("content", page.getContent());
        response.put("page", page.getNumber() + 1);
        response.put("size", page.getSize());
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        Long userId = getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // ========== ADMIN NOTIFICATIONS ==========

    /**
     * Lấy danh sách thông báo cho Admin
     */
    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('GET /api/notifications/admin')")
    public ResponseEntity<Map<String, Object>> getAdminNotifications(
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("[NotificationController] Fetching admin notifications");

        Page<Notification> page = notificationService.getAdminNotifications(pageable);
        long unreadCount = notificationService.getAdminUnreadCount();

        log.info("[NotificationController] Found {} admin notifications, {} unread",
                page.getTotalElements(), unreadCount);

        Map<String, Object> response = new HashMap<>();
        response.put("content", page.getContent());
        response.put("page", page.getNumber() + 1);
        response.put("size", page.getSize());
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    /**
     * Lấy số thông báo chưa đọc cho Admin
     */
    @GetMapping("/admin/count")
    @PreAuthorize("hasAuthority('GET /api/notifications/admin/count')")
    public ResponseEntity<Map<String, Long>> getAdminUnreadCount() {
        long unreadCount = notificationService.getAdminUnreadCount();
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }

    /**
     * Đánh dấu tất cả thông báo Admin đã đọc
     */
    @PutMapping("/admin/read-all")
    @PreAuthorize("hasAuthority('PUT /api/notifications/admin/read-all')")
    public ResponseEntity<Void> markAllAdminAsRead() {
        notificationService.markAllAdminAsRead();
        return ResponseEntity.ok().build();
    }

    // ========== HELPERS ==========

    /**
     * Lấy userId từ JWT token claims
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null) {
            log.error("Authentication is null");
            throw new IllegalArgumentException("User not authenticated");
        }

        log.debug("Authentication type: {}", auth.getClass().getName());
        log.debug("Principal type: {}", auth.getPrincipal().getClass().getName());

        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) auth
                    .getPrincipal();
            log.debug("JWT claims: {}", jwt.getClaims());

            Object userIdObj = jwt.getClaim("userId");
            if (userIdObj != null) {
                if (userIdObj instanceof Number) {
                    return ((Number) userIdObj).longValue();
                } else if (userIdObj instanceof String) {
                    return Long.parseLong((String) userIdObj);
                }
            }
            log.error("userId claim not found or invalid in JWT");
        } else {
            log.error("Principal is not JWT: {}", auth.getPrincipal().getClass().getSimpleName());
        }

        throw new IllegalArgumentException("User not authenticated or userId not found in token");
    }
}
