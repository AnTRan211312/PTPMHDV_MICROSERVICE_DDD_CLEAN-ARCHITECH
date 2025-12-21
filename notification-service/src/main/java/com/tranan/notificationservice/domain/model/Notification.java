package com.tranan.notificationservice.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String title;
    private String message;
    private String type; // ORDER, PAYMENT, SYSTEM, INVENTORY, etc.

    @JsonProperty("read")
    private boolean isRead;

    private String referenceId; // e.g., orderId, productId

    // Target role: USER (default), ADMIN (cho quản trị viên)
    @Builder.Default
    private String targetRole = "USER";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
