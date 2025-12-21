package com.tranan.cartservice.infrastructure.client.client;

import com.tranan.cartservice.infrastructure.client.dto.ProductDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Component
@Slf4j // Lombok log
public class ProductServiceClientFallbackFactory implements FallbackFactory<ProductServiceClient> {
    @Override
    public ProductServiceClient create(Throwable cause) {
        return new ProductServiceClient() {
            @Override
            public ProductDTO getProduct(Long productId) {
                log.error("Error calling product-service for id {}: {}", productId, cause.getMessage());
                return ProductDTO.builder().available(false).build();
            }
        };
    }
}
