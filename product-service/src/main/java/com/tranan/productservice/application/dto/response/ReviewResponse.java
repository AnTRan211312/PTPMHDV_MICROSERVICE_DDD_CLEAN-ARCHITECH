package com.tranan.productservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
    private Long id;
    private int rating;
    private String comment;

    // ✅ User info (enriched từ AuthService)
    private String userEmail;  // ✅ String, không phải Long
    private String userName;    // ✅ Thêm name
    private String avatar;

    private Instant createdAt;

    public ReviewResponse(Long id, int rating, String comment, Instant createAt, String s, String url) {
    }
}