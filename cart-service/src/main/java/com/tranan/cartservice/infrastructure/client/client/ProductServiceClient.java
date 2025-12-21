package com.tranan.cartservice.infrastructure.client.client;

import com.tranan.cartservice.infrastructure.client.dto.ProductDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // Nhớ import PathVariable

@FeignClient(
        name = "product-service",
        fallback = ProductServiceClientFallbackFactory.class // Thêm dòng này
)
public interface ProductServiceClient {

    @GetMapping("/api/internal/products/{productId}")
        // Lưu ý: Feign cần @PathVariable("tên_tham_số") rõ ràng
    ProductDTO getProduct(@PathVariable("productId") Long productId);
}