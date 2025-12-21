package com.tranan.cartservice.infrastructure.client.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CheckoutItemDTO {
    private Long productId;
    private String productName;
    private BigDecimal price;  // Effective price
    private Integer quantity;
    private BigDecimal subtotal;
}
