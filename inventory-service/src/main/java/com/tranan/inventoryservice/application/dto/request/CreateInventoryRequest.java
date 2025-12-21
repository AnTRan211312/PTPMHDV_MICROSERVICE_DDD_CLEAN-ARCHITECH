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
public class CreateInventoryRequest {

    // Đã xóa productId (vì lấy từ URL)

    @NotNull(message = "Initial quantity is required")
    @Min(value = 0, message = "Quantity must be >= 0")
    private Integer quantity;
}