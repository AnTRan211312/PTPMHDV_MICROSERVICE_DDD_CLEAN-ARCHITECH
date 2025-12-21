package com.tranan.productservice.presentation.controller;

import com.tranan.productservice.annotation.ApiMessage;
import com.tranan.productservice.application.dto.request.CreateReviewRequest;
import com.tranan.productservice.application.dto.response.PageResponseDto;
import com.tranan.productservice.application.dto.response.ReviewResponse;
import com.tranan.productservice.application.usecase.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Review", description = "Quản lý đánh giá sản phẩm")
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Validated
public class ReviewController {

        private final ReviewService reviewService;

        // =========================================================================
        // CREATE - User tạo review cho product
        // =========================================================================

        @PostMapping("/products/{productId}")
        @ApiMessage("Tạo đánh giá thành công")
        @Operation(summary = "Tạo đánh giá cho sản phẩm (User)", description = "User đã đăng nhập có thể đánh giá sản phẩm")
        @SecurityRequirements
        public ResponseEntity<ReviewResponse> createReview(
                        @PathVariable @Min(value = 1, message = "Product ID phải lớn hơn 0") Long productId,
                        @Valid @RequestBody CreateReviewRequest request) {

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(reviewService.createReview(productId, request));
        }

        // =========================================================================
        // READ - Get reviews by product (Public)
        // =========================================================================

        @GetMapping("/products/{productId}")
        @ApiMessage("Lấy danh sách đánh giá của sản phẩm")
        @Operation(summary = "Lấy danh sách đánh giá theo sản phẩm (Public)", description = "Không yêu cầu đăng nhập")
        public ResponseEntity<PageResponseDto<ReviewResponse>> getReviewsByProduct(
                        @PathVariable @Min(value = 1, message = "Product ID phải lớn hơn 0") Long productId,
                        Pageable pageable) {

                Page<ReviewResponse> page = reviewService.getReviewsByProductId(productId, pageable);

                PageResponseDto<ReviewResponse> response = new PageResponseDto<>(
                                page.getContent(),
                                page.getNumber() + 1,
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages());

                return ResponseEntity.ok(response);
        }

        // =========================================================================
        // READ - Get all reviews (Admin)
        // =========================================================================

        @GetMapping
        @ApiMessage("Lấy tất cả đánh giá")
        @Operation(summary = "Lấy tất cả đánh giá ")
        public ResponseEntity<PageResponseDto<ReviewResponse>> searchReviews(
                        @RequestParam(required = false) String keyword,
                        Pageable pageable) {

                Page<ReviewResponse> page = reviewService.searchReviews(keyword, pageable);

                PageResponseDto<ReviewResponse> response = new PageResponseDto<>(
                                page.getContent(),
                                page.getNumber() + 1,
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages());

                return ResponseEntity.ok(response);
        }

        // =========================================================================
        // READ - Get review by ID
        // =========================================================================

        @GetMapping("/{id}")
        @ApiMessage("Lấy chi tiết đánh giá")
        public ResponseEntity<ReviewResponse> getReviewById(
                        @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id) {

                return ResponseEntity.ok(reviewService.getReviewById(id));
        }

        // =========================================================================
        // UPDATE - Chỉ owner
        // =========================================================================

        @PutMapping("/{id}")
        @ApiMessage("Cập nhật đánh giá thành công")
        @SecurityRequirements
        public ResponseEntity<ReviewResponse> updateReview(
                        @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id,
                        @Valid @RequestBody CreateReviewRequest request) {

                return ResponseEntity.ok(reviewService.updateReview(id, request));
        }

        // =========================================================================
        // DELETE - Owner hoặc Admin
        // =========================================================================

        @DeleteMapping("/{id}")
        @ApiMessage("Xóa đánh giá thành công")
        @Operation(summary = "Xóa đánh giá (Owner/Admin)", description = "Người tạo hoặc Admin có thể xóa")
        public ResponseEntity<Void> deleteReview(
                        @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id) {

                reviewService.deleteReview(id);
                return ResponseEntity.noContent().build();
        }

        // =========================================================================
        // STATISTICS
        // =========================================================================

        @GetMapping("/products/{productId}/stats")
        @ApiMessage("Lấy thống kê đánh giá sản phẩm")
        @Operation(summary = "Lấy thống kê đánh giá sản phẩm (Public)")
        @SecurityRequirement(name = "")
        public ResponseEntity<ReviewService.ReviewStatistics> getReviewStats(
                        @PathVariable @Min(value = 1, message = "Product ID phải lớn hơn 0") Long productId) {

                return ResponseEntity.ok(reviewService.getProductReviewStats(productId));
        }

        // =========================================================================
        // ADMIN STATISTICS
        // =========================================================================

        @GetMapping("/admin/stats")
        @ApiMessage("Lấy thống kê đánh giá toàn hệ thống")
        @Operation(summary = "Lấy thống kê đánh giá (Admin)", description = "Trả về tổng số đánh giá và điểm trung bình toàn hệ thống")
        @PreAuthorize("hasAuthority('GET /api/reviews/admin/stats')")
        public ResponseEntity<ReviewService.GlobalReviewStatistics> getGlobalReviewStats() {
                return ResponseEntity.ok(reviewService.getGlobalReviewStats());
        }

        // =========================================================================
        // USER - My Reviews History
        // =========================================================================

        @GetMapping("/my-reviews")
        @ApiMessage("Lấy lịch sử đánh giá của tôi")
        @Operation(summary = "Lấy lịch sử đánh giá (User)", description = "Trả về danh sách các đánh giá mà user đã viết")
        @SecurityRequirement(name = "bearerAuth")
        public ResponseEntity<PageResponseDto<ReviewService.MyReviewResponse>> getMyReviews(Pageable pageable) {
                Page<ReviewService.MyReviewResponse> page = reviewService.getMyReviews(pageable);

                PageResponseDto<ReviewService.MyReviewResponse> response = new PageResponseDto<>(
                                page.getContent(),
                                page.getNumber() + 1,
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages());

                return ResponseEntity.ok(response);
        }
}
