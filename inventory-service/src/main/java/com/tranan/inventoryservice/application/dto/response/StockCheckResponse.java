package com.tranan.inventoryservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckResponse {
    private Long productId;
    private Boolean available;
    private Integer quantityAvailable;
    private Integer requestedQuantity;
    private String message;
}
