package com.tranan.productservice.domain.repository;

import com.tranan.productservice.domain.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ReviewRepository {

    Review save(Review review, Long productId);

    Optional<Review> findById(Long id);

    Page<Review> findByProductId(Long productId, Pageable pageable);

    long countByProductId(Long productId);

    double calculateAverageRating(Long productId);

    void deleteById(Long id);

    Page<Review> searchReview(String keyword, Pageable pageable);

    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    // Global statistics
    long count();

    double calculateGlobalAverageRating();

    // User's reviews history
    Page<Review> findByUserEmail(String userEmail, Pageable pageable);

    // User's reviews with product info (for review history page)
    Page<com.tranan.productservice.application.usecase.ReviewService.MyReviewResponse> findByUserEmailWithProduct(
            String userEmail, Pageable pageable);
}
