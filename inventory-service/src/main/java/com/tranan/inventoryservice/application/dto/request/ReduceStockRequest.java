package com.tranan.inventoryservice.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReduceStockRequest {
    
    @NotNull(message = "Product ID không được để trống")
    private Long productId;
    
    @NotNull(message = "Quantity không được để trống")
    @Min(value = 1, message = "Quantity phải lớn hơn 0")
    private Integer quantity;
}
