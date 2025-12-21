package com.tranan.productservice.infrastructure.client.internal;

import com.tranan.productservice.annotation.ApiMessage;
import com.tranan.productservice.application.dto.response.ProductResponse;
import com.tranan.productservice.application.usecase.ProductService;
import com.tranan.productservice.domain.repository.ProductRepository;
import com.tranan.productservice.infrastructure.client.dto.ProductDTO;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/products")
@RequiredArgsConstructor
public class InternalProductController {

        private final ProductRepository productRepository;
        private final ProductService productService;

        @GetMapping("/{id}/exists")
        @ApiMessage("Kiểm tra tồn tại")
        @Operation(summary = "Kiểm tra tồn tại", description = "Kiểm tra tồn tại")
        public java.util.Map<String, Boolean> checkProductExists(@PathVariable Long id) {
                boolean exists = productRepository.existsById(id);
                return java.util.Map.of("exists", exists);
        }

        @GetMapping("/{id}/name")
        @ApiMessage("Lấy tên sản phẩm")
        @Operation(summary = "Lấy tên sản phẩm", description = "Lấy tên sản phẩm")
        public String getProductName(@PathVariable Long id) {
                return productRepository.findById(id)
                                .map(product -> product.getName())
                                .orElse("Unknown");
        }

        @GetMapping("/{id}")
        @ApiMessage("Lấy chi tiết sản phẩm (Internal)")
        @Operation(summary = "Lấy chi tiết sản phẩm cho service khác")
        public ProductDTO getProduct(@PathVariable Long id) {
                return productRepository.findById(id)
                                .map(product -> ProductDTO.builder()
                                                .id(product.getId())
                                                .name(product.getName())
                                                .description(product.getDescription())
                                                .thumbnail(product.getThumbnail())
                                                .price(product.getPrice())
                                                .discountPrice(product.getDiscountPrice())
                                                .available(true)
                                                .build())
                                .orElse(null);
        }

        @GetMapping("/batch")
        @ApiMessage("Lấy nhiều sản phẩm (Internal)")
        @Operation(summary = "Lấy nhiều sản phẩm theo IDs cho service khác")
        public List<ProductDTO> getProductsByIds(@RequestParam List<Long> ids) {
                List<ProductResponse> products = productService.getProductsByIds(ids);

                return products.stream()
                                .map(product -> ProductDTO.builder()
                                                .id(product.getId())
                                                .name(product.getName())
                                                .description(product.getDescription())
                                                .thumbnail(product.getThumbnail())
                                                .price(product.getPrice())
                                                .discountPrice(product.getDiscountPrice())
                                                .available(true)
                                                .build())
                                .collect(Collectors.toList());
        }

        @GetMapping("/search")
        @ApiMessage("Tìm kiếm sản phẩm theo tên (Internal)")
        @Operation(summary = "Tìm kiếm sản phẩm theo tên, trả về danh sách Product IDs")
        public List<Long> searchProductIdsByName(@RequestParam String keyword) {
                return productService.searchProductIdsByName(keyword);
        }
}