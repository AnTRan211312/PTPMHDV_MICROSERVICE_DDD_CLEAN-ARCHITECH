package com.tranan.productservice.presentation.controller;

import com.tranan.productservice.annotation.ApiMessage;
import com.tranan.productservice.application.dto.request.CreateProductRequest;
import com.tranan.productservice.application.dto.request.UpdateProductRequest;
import com.tranan.productservice.application.dto.response.PageResponseDto;
import com.tranan.productservice.application.dto.response.ProductResponse;
import com.tranan.productservice.application.usecase.ProductService;
import com.tranan.productservice.domain.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Product", description = "Quản lý sản phẩm")
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

        private final ProductService productService;

        // =========================================================================
        // CREATE - Upload file cùng lúc tạo product
        // =========================================================================

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @ApiMessage("Tạo sản phẩm thành công")
        @PreAuthorize("hasAuthority('POST /api/products')")
        @Operation(summary = "Tạo sản phẩm mới (Admin)", description = "Yêu cầu quyền: <b>POST /api/products</b>. Upload ảnh cùng lúc tạo product.")
        public ResponseEntity<ProductResponse> createProduct(
                        @Valid @RequestPart("product") CreateProductRequest request,
                        @RequestPart("thumbnail") MultipartFile thumbnailFile,
                        @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles) {

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(productService.addProduct(request, thumbnailFile, imageFiles));
        }

        // =========================================================================
        // READ - LIST
        // =========================================================================

        @GetMapping
        @ApiMessage("Lấy danh sách sản phẩm")
        @Operation(summary = "Lấy danh sách sản phẩm (Public)", description = "Hỗ trợ tìm kiếm theo keyword, lọc theo danh mục và khoảng giá. Không yêu cầu authentication.")
        public ResponseEntity<PageResponseDto<ProductResponse>> getAllProducts(
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) List<Long> categoryIds,
                        @RequestParam(required = false) java.math.BigDecimal minPrice,
                        @RequestParam(required = false) java.math.BigDecimal maxPrice,
                        @PageableDefault(size = 10) Pageable pageable) {

                Page<ProductResponse> page;

                // Use advanced search if any filter is provided
                boolean hasFilters = (categoryIds != null && !categoryIds.isEmpty())
                                || (minPrice != null && minPrice.compareTo(java.math.BigDecimal.ZERO) > 0)
                                || (maxPrice != null && maxPrice.compareTo(java.math.BigDecimal.ZERO) > 0);

                if (hasFilters) {
                        page = productService.getAllProductsAdvanced(keyword, categoryIds, minPrice, maxPrice,
                                        pageable);
                } else {
                        page = productService.getAllProducts(keyword, pageable);
                }

                PageResponseDto<ProductResponse> response = new PageResponseDto<>(
                                page.getContent(),
                                page.getNumber() + 1,
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages());

                return ResponseEntity.ok(response);
        }

        // =========================================================================
        // READ - DETAIL
        // =========================================================================

        @GetMapping("/{id}")
        @ApiMessage("Lấy chi tiết sản phẩm")
        @Operation(summary = "Lấy chi tiết sản phẩm theo ID (Public)", description = "Trả về đầy đủ thông tin sản phẩm kèm categories và reviews.")
        @SecurityRequirements
        public ResponseEntity<ProductResponse> getProductById(
                        @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id) {

                return ResponseEntity.ok(productService.getProductById(id));
        }

        // =========================================================================
        // UPDATE - Upload file mới khi update
        // =========================================================================

        @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @ApiMessage("Cập nhật sản phẩm thành công")
        @PreAuthorize("hasAuthority('PUT /api/products/{id}')")
        @Operation(summary = "Cập nhật sản phẩm (Admin)", description = "Yêu cầu quyền: <b>PUT /api/products/{id}</b>. Ảnh cũ sẽ được xóa tự động.")
        public ResponseEntity<ProductResponse> updateProduct(
                        @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id,
                        @Valid @RequestPart("product") UpdateProductRequest request,
                        @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnailFile,
                        @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles) {

                return ResponseEntity.ok(
                                productService.updateProduct(id, request, thumbnailFile, imageFiles));
        }

        // =========================================================================
        // DELETE
        // =========================================================================

        @DeleteMapping("/{id}")
        @ApiMessage("Xóa sản phẩm thành công")
        @PreAuthorize("hasAuthority('DELETE /api/products/{id}')")
        @Operation(summary = "Xóa sản phẩm (Admin)", description = "Yêu cầu quyền: <b>DELETE /api/products/{id}</b>. Ảnh trên S3 sẽ được xóa tự động.")
        public ResponseEntity<Void> deleteProduct(
                        @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id) {

                productService.deleteProduct(id);
                return ResponseEntity.noContent().build();
        }

        // =========================================================================
        // ADMIN STATISTICS - Dashboard
        // =========================================================================

        @GetMapping("/admin/stats")
        @ApiMessage("Lấy thống kê sản phẩm")
        @PreAuthorize("hasAuthority('GET /api/products/admin/stats')")
        @Operation(summary = "Lấy thống kê sản phẩm (Admin)", description = "Yêu cầu quyền: <b>GET /api/products/admin/stats</b>. Trả về tổng số sản phẩm và top 5 sản phẩm bán chạy.")
        public ResponseEntity<com.tranan.productservice.application.dto.response.ProductStatsResponse> getProductStats() {
                return ResponseEntity.ok(productService.getProductStats());
        }

}