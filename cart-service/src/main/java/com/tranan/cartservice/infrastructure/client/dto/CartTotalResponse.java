package com.tranan.cartservice.infrastructure.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartTotalResponse {
    private Long userId;
    private BigDecimal totalAmount;
    private Integer totalItems;
}
