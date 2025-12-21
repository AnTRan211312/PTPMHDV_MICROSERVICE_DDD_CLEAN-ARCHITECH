package com.tranan.productservice.infrastructure.client.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private String thumbnail;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Boolean available;
}
