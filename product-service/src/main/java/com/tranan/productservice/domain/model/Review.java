package com.tranan.productservice.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    private Long id;
    private int rating;
    private String comment;

    // ✅ Chỉ lưu email, không phụ thuộc User domain
    private String userEmail; // ✅ camelCase

    // Read-only, gán từ infrastructure
    private Instant createdAt;

    // ======================================================
    // Business Creation
    // ======================================================
    public Review(String userEmail, int rating, String comment) {
        validateRating(rating);
        this.userEmail = userEmail;
        this.rating = rating;
        this.comment = comment;
    }

    // ======================================================
    // Rehydration (Mapper từ DB)
    // ======================================================
    public Review(Long id, String userEmail, int rating, String comment, Instant createdAt) {
        this.id = id;
        this.userEmail = userEmail;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    // ======================================================
    // Business Methods
    // ======================================================

    public void updateReview(int rating, String comment) {
        validateRating(rating);
        this.rating = rating;
        this.comment = comment;
    }

    private void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating phải từ 1 đến 5");
        }
    }
}