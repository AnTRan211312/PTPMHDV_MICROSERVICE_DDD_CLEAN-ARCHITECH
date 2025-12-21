package com.tranan.cartservice.infrastructure.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryQuantityResponse {
    private Long productId;
    private Integer quantity;  // Có thể null nếu sản phẩm chưa có inventory
}
