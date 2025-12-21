package com.tranan.paymentservice.infrastructure.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long orderId;
    private Long userId;
    private String orderCode;
    private List<OrderItemResponse> items;
    private Integer totalItems;
    private BigDecimal totalAmount;
    private String status;
    private Instant createdAt;
}
