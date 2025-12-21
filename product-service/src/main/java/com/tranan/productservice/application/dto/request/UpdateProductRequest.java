package com.tranan.productservice.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
public class UpdateProductRequest {

    // Các trường này có thể null (nghĩa là không muốn update trường đó)
    @Size(min = 2, max = 255)
    private String name;
    private String description;
    @DecimalMin(value = "0.0")
    private BigDecimal price;
    private Set<Long> categoryIds;
    private BigDecimal discountPrice;
    private List<String> keptImages;
}