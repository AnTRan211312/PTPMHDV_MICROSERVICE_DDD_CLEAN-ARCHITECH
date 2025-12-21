package com.tranan.inventoryservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InventoryStatsResponse {
    private long total;
    private long lowStock;
    private long outOfStock;
}
