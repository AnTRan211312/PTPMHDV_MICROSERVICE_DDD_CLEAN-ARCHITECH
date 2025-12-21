package com.tranan.cartservice.application.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemResponse {
    private Long productId;
    private String productName;
    private String productDescription;
    private String productImage;
    private BigDecimal originalPrice;
    private BigDecimal discountPrice;
    private BigDecimal effectivePrice;  // Giá được sử dụng để tính
    private Integer quantity;
    private BigDecimal subtotal;
}
