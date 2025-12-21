package com.tranan.productservice.application.usecase;

import com.tranan.productservice.application.dto.request.CreateReviewRequest;
import com.tranan.productservice.application.dto.response.ReviewResponse;
import com.tranan.productservice.domain.model.Product;
import com.tranan.productservice.domain.model.Review;
import com.tranan.productservice.domain.repository.ProductRepository;
import com.tranan.productservice.domain.repository.ReviewRepository;
import com.tranan.productservice.infrastructure.client.client.AuthServiceClient;
import com.tranan.productservice.infrastructure.client.dto.UserInfoResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Validated
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final AuthServiceClient authServiceClient;

    // =========================================================================
    // CREATE - Tạo review cho product
    // =========================================================================

    @Transactional
    public ReviewResponse createReview(
            @NotNull @Min(1) Long productId,
            @NotNull CreateReviewRequest request) {

        log.info("Creating review for product ID: {}", productId);

        // 1. Get current user email
        String userEmail = getCurrentUserEmail();

        // 2. Verify product exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Product not found with ID: " + productId));

        // 3. Create review domain
        Review review = new Review(
                userEmail,
                request.getRating(),
                request.getComment());

        // 4. Save review
        Review savedReview = reviewRepository.save(review, productId);
        log.info("Review created with ID: {}", savedReview.getId());

        // 5. ✅ UPDATE PRODUCT STATISTICS
        updateProductReviewStatistics(productId);

        // 6. Map to response and enrich user info
        return mapToResponse(savedReview);
    }

    // =========================================================================
    // UPDATE - Chỉ owner mới update được
    // =========================================================================

    @Transactional
    public ReviewResponse updateReview(
            @NotNull @Min(1) Long reviewId,
            @NotNull CreateReviewRequest request) {

        log.info("Updating review ID: {}", reviewId);

        String currentUserEmail = getCurrentUserEmail();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Review not found with ID: " + reviewId));

        // Verify ownership
        if (!review.getUserEmail().equals(currentUserEmail)) {
            throw new SecurityException("Bạn không có quyền sửa review này");
        }

        // Update
        review.updateReview(request.getRating(), request.getComment());

        // TODO: Save updated review
        // Review updatedReview = reviewRepository.update(review);

        // ✅ Cần fetch productId từ review (hiện tại Review domain không có productId)
        // Workaround: Query để tìm productId
        // Better: Add productId to Review domain model

        log.info("Review updated with ID: {}", reviewId);

        return mapToResponse(review);
    }

    // =========================================================================
    // DELETE - Chỉ owner hoặc admin
    // =========================================================================

    @Transactional
    public void deleteReview(@NotNull @Min(1) Long reviewId) {
        log.info("Deleting review ID: {}", reviewId);

        String currentUserEmail = getCurrentUserEmail();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Review not found with ID: " + reviewId));

        // Verify ownership (hoặc check isAdmin)
        if (!review.getUserEmail().equals(currentUserEmail) && !isAdmin()) {
            throw new SecurityException("Bạn không có quyền xóa review này");
        }

        // TODO: Cần biết productId để update statistics sau khi xóa
        // Workaround: Query trước khi xóa

        reviewRepository.deleteById(reviewId);

        // ✅ UPDATE PRODUCT STATISTICS
        // updateProductReviewStatistics(productId);

        log.info("Review deleted with ID: {}", reviewId);
    }

    // =========================================================================
    // READ METHODS (giữ nguyên như cũ)
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByProductId(
            @NotNull @Min(1) Long productId,
            Pageable pageable) {

        log.debug("Getting reviews for product ID: {}", productId);

        if (!productRepository.existsById(productId)) {
            throw new EntityNotFoundException("Product not found with ID: " + productId);
        }

        Page<Review> reviewPage = reviewRepository.findByProductId(productId, pageable);
        return enrichReviewsWithUserInfo(reviewPage);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> searchReviews(String keyword, Pageable pageable) {
        log.debug("Searching reviews with keyword: {}", keyword);

        long startTime = System.currentTimeMillis();
        Page<Review> reviewPage = reviewRepository.searchReview(keyword, pageable);
        log.info("⏱️ Query reviews took: {}ms", System.currentTimeMillis() - startTime);

        long enrichStart = System.currentTimeMillis();
        Page<ReviewResponse> result = enrichReviewsWithUserInfo(reviewPage);
        log.info("⏱️ Enrich user info took: {}ms", System.currentTimeMillis() - enrichStart);

        return result;
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(@NotNull @Min(1) Long id) {
        log.debug("Getting review by ID: {}", id);

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Review not found with ID: " + id));

        return mapToResponse(review);
    }

    @Transactional(readOnly = true)
    public ReviewStatistics getProductReviewStats(@NotNull @Min(1) Long productId) {
        long count = reviewRepository.countByProductId(productId);
        double average = reviewRepository.calculateAverageRating(productId);
        return new ReviewStatistics(productId, count, average);
    }

    /**
     * Lấy thống kê toàn bộ reviews trong hệ thống (cho Dashboard Admin)
     */
    @Transactional(readOnly = true)
    public GlobalReviewStatistics getGlobalReviewStats() {
        log.info("Getting global review statistics for dashboard");
        long totalReviews = reviewRepository.count();
        double averageRating = reviewRepository.calculateGlobalAverageRating();
        return new GlobalReviewStatistics(totalReviews, averageRating);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class GlobalReviewStatistics {
        private long totalReviews;
        private double averageRating;
    }

    /**
     * Lấy danh sách reviews của user hiện tại (Lịch sử đánh giá)
     */
    @Transactional(readOnly = true)
    public Page<MyReviewResponse> getMyReviews(Pageable pageable) {
        String userEmail = getCurrentUserEmail();
        log.info("Getting reviews history for user: {}", userEmail);

        // Get reviews with product info directly from repository
        return reviewRepository.findByUserEmailWithProduct(userEmail, pageable);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class MyReviewResponse {
        private Long id;
        private int rating;
        private String comment;
        private java.time.Instant createdAt;
        private Long productId;
        private String productName;
        private String productThumbnail;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * ✅ METHOD MỚI - Update Product statistics sau khi thêm/sửa/xóa review
     */
    private void updateProductReviewStatistics(Long productId) {
        log.debug("Updating product statistics for product ID: {}", productId);

        // Tính lại từ repository
        long count = reviewRepository.countByProductId(productId);
        double average = reviewRepository.calculateAverageRating(productId);

        // ✅ GỌI REPOSITORY ĐỂ CẬP NHẬT VÀO DATABASE
        productRepository.updateProductStatistics(productId, average, count);

        log.info("Updated product {} statistics: count={}, average={}", productId, count, average);
    }

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new SecurityException("User chưa đăng nhập");
        }

        return authentication.getName();
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private Page<ReviewResponse> enrichReviewsWithUserInfo(Page<Review> reviewPage) {
        if (reviewPage.isEmpty()) {
            return Page.empty(reviewPage.getPageable());
        }

        List<String> emails = reviewPage.getContent().stream()
                .map(Review::getUserEmail)
                .distinct()
                .collect(Collectors.toList());

        log.debug("📧 Fetching user info for {} unique emails", emails.size());

        Map<String, UserInfoResponse> userInfoMap = new HashMap<>();
        try {
            long authCallStart = System.currentTimeMillis();
            List<UserInfoResponse> userInfos = authServiceClient.getUsersByEmails(emails);
            log.info("⏱️ AuthService call took: {}ms for {} emails",
                    System.currentTimeMillis() - authCallStart, emails.size());

            userInfoMap = userInfos.stream()
                    .collect(Collectors.toMap(UserInfoResponse::getEmail, u -> u));
        } catch (Exception e) {
            log.error("❌ Failed to fetch user info from AuthService", e);
        }

        Map<String, UserInfoResponse> finalUserInfoMap = userInfoMap;
        return reviewPage.map(review -> mapToResponseWithUserInfo(review, finalUserInfoMap));
    }

    private ReviewResponse mapToResponse(Review review) {
        if (review == null)
            return null;

        UserInfoResponse userInfo = null;
        try {
            userInfo = authServiceClient.getUserByEmail(review.getUserEmail());
        } catch (Exception e) {
            log.warn("Failed to fetch user info for email: {}", review.getUserEmail(), e);
        }

        return mapToResponseWithUserInfo(review, userInfo);
    }

    private ReviewResponse mapToResponseWithUserInfo(Review review, Map<String, UserInfoResponse> userInfoMap) {
        UserInfoResponse userInfo = userInfoMap.get(review.getUserEmail());
        return mapToResponseWithUserInfo(review, userInfo);
    }

    private ReviewResponse mapToResponseWithUserInfo(Review review, UserInfoResponse userInfo) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setUserEmail(review.getUserEmail());
        response.setCreatedAt(review.getCreatedAt());

        if (userInfo != null) {
            response.setUserName(userInfo.getName());
            response.setAvatar(userInfo.getAvatar());
        } else {
            response.setUserName("Unknown User");
            response.setAvatar(null);
        }

        return response;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ReviewStatistics {
        private Long productId;
        private long totalReviews;
        private double averageRating;
    }
}