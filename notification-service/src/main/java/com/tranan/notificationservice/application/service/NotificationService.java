package com.tranan.notificationservice.application.service;

import com.tranan.notificationservice.domain.model.Notification;
import com.tranan.notificationservice.infrastructure.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    /**
     * Tạo notification cho User thông thường
     */
    @Transactional
    public void createNotification(Long userId, String title, String message, String type, String referenceId) {
        log.info("[NotificationService] Creating notification for userId: {}, type: {}, referenceId: {}",
                userId, type, referenceId);
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .targetRole("USER")
                .build();
        Notification saved = notificationRepository.save(notification);
        log.info("[NotificationService] Notification saved with id: {} for userId: {}", saved.getId(), userId);
    }

    /**
     * Tạo notification cho Admin (tất cả admin sẽ nhìn thấy)
     */
    @Transactional
    public void createAdminNotification(String title, String message, String type, String referenceId) {
        log.info("[NotificationService] Creating ADMIN notification: type={}, referenceId={}", type, referenceId);
        Notification notification = Notification.builder()
                .userId(null) // Admin notification không gắn với user cụ thể
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .targetRole("ADMIN")
                .build();
        Notification saved = notificationRepository.save(notification);
        log.info("[NotificationService] Admin notification saved with id: {}", saved.getId());
    }

    // ========== USER NOTIFICATIONS ==========

    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(notification -> {
            if (!notification.isRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }

    // ========== ADMIN NOTIFICATIONS ==========

    public Page<Notification> getAdminNotifications(Pageable pageable) {
        return notificationRepository.findByTargetRoleOrderByCreatedAtDesc("ADMIN", pageable);
    }

    public long getAdminUnreadCount() {
        return notificationRepository.countByTargetRoleAndIsReadFalse("ADMIN");
    }

    @Transactional
    public void markAllAdminAsRead() {
        notificationRepository.findByTargetRoleOrderByCreatedAtDesc("ADMIN").forEach(notification -> {
            if (!notification.isRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }
}
