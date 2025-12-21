package com.tranan.inventoryservice.infrastructure.client.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ProductClientFallbackFactory implements FallbackFactory<ProductClient> {

    @Override
    public ProductClient create(Throwable cause) {
        return new ProductClient() {
            @Override
            public java.util.Map<String, Boolean> checkProductExists(Long id) {
                log.error("Lỗi khi gọi Product Service check tồn tại id {}: {}", id, cause.getMessage());
                return java.util.Map.of("exists", false);
            }

            @Override
            public String getProductName(Long id) {
                log.error("Lỗi khi gọi Product Service lấy tên sản phẩm id {}: {}", id, cause.getMessage());
                return "Unknown"; // Trả về tên mặc định
            }

            @Override
            public java.util.List<com.tranan.inventoryservice.infrastructure.client.dto.ProductDTO> getProductsByIds(
                    java.util.List<Long> ids) {
                log.error("Lỗi khi gọi Product Service lấy danh sách sản phẩm: {}", cause.getMessage());
                return java.util.List.of(); // Trả về danh sách rỗng
            }

            @Override
            public java.util.List<Long> searchProductIdsByName(String keyword) {
                log.error("Lỗi khi gọi Product Service tìm kiếm sản phẩm với keyword {}: {}", keyword,
                        cause.getMessage());
                return java.util.List.of(); // Trả về danh sách rỗng
            }
        };
    }
}