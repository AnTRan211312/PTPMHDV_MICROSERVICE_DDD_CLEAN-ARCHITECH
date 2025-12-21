package com.tranan.notificationservice.infrastructure.repository;

import com.tranan.notificationservice.domain.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    // Admin notifications (targetRole = 'ADMIN')
    Page<Notification> findByTargetRoleOrderByCreatedAtDesc(String targetRole, Pageable pageable);

    List<Notification> findByTargetRoleOrderByCreatedAtDesc(String targetRole);

    long countByTargetRoleAndIsReadFalse(String targetRole);
}
