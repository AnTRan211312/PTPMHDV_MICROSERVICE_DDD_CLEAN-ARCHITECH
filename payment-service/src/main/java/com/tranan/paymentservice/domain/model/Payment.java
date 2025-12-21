package com.tranan.paymentservice.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    private Long id;
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String paymentMethod; // VNPAY, COD, etc.
    private String status; // PENDING, COMPLETED, FAILED, CANCELLED
    private String transactionId; // VNPay transaction ID
    private String bankCode;
    private String cardType;
    private Instant createdAt;
    private Instant updatedAt;
    
    public void markAsCompleted(String transactionId) {
        this.status = "COMPLETED";
        this.transactionId = transactionId;
        this.updatedAt = Instant.now();
    }
    
    public void markAsFailed() {
        this.status = "FAILED";
        this.updatedAt = Instant.now();
    }
    
    public boolean isPending() {
        return "PENDING".equals(this.status);
    }
}
