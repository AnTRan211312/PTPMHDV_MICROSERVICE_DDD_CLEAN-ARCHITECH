package com.tranan.productservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response chứa thống kê sản phẩm cho Dashboard Admin
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductStatsResponse {
    private long totalProducts;

    /**
     * Top sản phẩm bán chạy (dựa trên reviewCount hoặc order count)
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopProduct {
        private Long productId;
        private String productName;
        private String thumbnail;
        private int salesCount;
        private Double averageRating;
    }

    private List<TopProduct> topProducts;
}
