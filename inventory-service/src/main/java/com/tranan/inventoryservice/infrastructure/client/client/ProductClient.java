package com.tranan.inventoryservice.infrastructure.client.client;

import com.tranan.inventoryservice.annotation.ApiMessage;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * GỌI SANG PRODUCT-SERVICE
 * FallbackFactory để xử lý khi Product Service bị sập hoặc lỗi mạng
 */
@FeignClient(name = "product-service", fallbackFactory = ProductClientFallbackFactory.class)
public interface ProductClient {

        // Kiểm tra nhanh sự tồn tại của sản phẩm
        // Không cần cache vì thao tác nhập kho không diễn ra liên tục như việc get user
        // info
        @GetMapping("/api/internal/products/{id}/exists")
        @ApiMessage("API internal kiemr tra productid có tồn tại hay không")
        @Operation(summary = "Kiểm tra", description = "Kiểm tra productId")
        java.util.Map<String, Boolean> checkProductExists(@PathVariable("id") Long id);

        @GetMapping("/api/internal/products/{id}/name")
        @ApiMessage("API internal lấy tên sản phẩm")
        @Operation(summary = "Lấy tên sản phẩm", description = "Lấy tên sản phẩm theo ID")
        String getProductName(@PathVariable("id") Long id);

        @GetMapping("/api/internal/products/batch")
        @ApiMessage("API internal lấy danh sách sản phẩm")
        @Operation(summary = "Lấy danh sách sản phẩm", description = "Lấy danh sách sản phẩm theo IDs")
        java.util.List<com.tranan.inventoryservice.infrastructure.client.dto.ProductDTO> getProductsByIds(
                        @org.springframework.web.bind.annotation.RequestParam List<Long> ids);

        @GetMapping("/api/internal/products/search")
        @ApiMessage("API internal tìm kiếm sản phẩm theo tên")
        @Operation(summary = "Tìm kiếm sản phẩm theo tên", description = "Trả về danh sách Product IDs")
        java.util.List<Long> searchProductIdsByName(
                        @org.springframework.web.bind.annotation.RequestParam String keyword);
}