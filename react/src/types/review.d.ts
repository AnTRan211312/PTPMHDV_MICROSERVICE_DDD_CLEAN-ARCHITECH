// --- REQUEST INTERFACES ---

/**
 * Yêu cầu tạo/cập nhật đánh giá (CreateReviewRequest)
 */
export interface CreateReviewRequest {
    rating: number;      // 1-5 stars
    comment?: string;    // Optional comment
}

// --- RESPONSE INTERFACES ---

/**
 * Chi tiết một đánh giá (ReviewResponse)
 */
export interface ReviewResponse {
    id: number;          // Long -> number
    rating: number;      // 1-5
    comment: string;
    userEmail: string;
    userName: string;
    avatar: string | null;
    createdAt: string;   // ISO 8601 string
}

/**
 * Thống kê đánh giá sản phẩm (ReviewStatistics)
 */
export interface ReviewStatistics {
    productId: number;
    totalReviews: number;
    averageRating: number;
}

/**
 * Phản hồi danh sách đánh giá (phân trang)
 */
export interface ReviewListResponse {
    content: ReviewResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
