package com.tranan.cartservice.infrastructure.client.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CheckoutSummaryDTO {
    private Long userId;
    private List<CheckoutItemDTO> items;
    private BigDecimal totalAmount;
}
