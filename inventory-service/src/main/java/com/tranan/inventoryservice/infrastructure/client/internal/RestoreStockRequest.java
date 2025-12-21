package com.tranan.inventoryservice.infrastructure.client.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestoreStockRequest {
    private Long productId;
    private Integer quantity;
}
