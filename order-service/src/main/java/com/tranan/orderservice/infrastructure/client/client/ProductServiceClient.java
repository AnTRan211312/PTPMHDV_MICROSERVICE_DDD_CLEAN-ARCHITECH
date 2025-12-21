package com.tranan.orderservice.infrastructure.client.client;

import com.tranan.orderservice.infrastructure.client.dto.ProductDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "product-service")
public interface ProductServiceClient {
    
    @GetMapping("/api/internal/products/batch")
    List<ProductDTO> getProductsByIds(@RequestParam("ids") List<Long> ids);
}
