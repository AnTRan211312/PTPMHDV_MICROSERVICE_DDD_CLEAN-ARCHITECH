
import axiosClient from "@/lib/axiosClient";
import type {
    CreateReviewRequest,
    ReviewResponse,
    ReviewStatistics,
    ReviewListResponse,
} from '@/types/review';
import type { ApiResponse } from '@/types/apiResponse';

const REVIEWS_API = '/reviews';

/**
 * Create a new review for a product
 */
export const createReview = async (
    productId: number,
    request: CreateReviewRequest
): Promise<ReviewResponse> => {
    const response = await axiosClient.post<ApiResponse<ReviewResponse>>(
        `${REVIEWS_API}/products/${productId}`,
        request
    );
    return response.data.data;
};

/**
 * Get reviews for a specific product (paginated)
 */
export const getReviewsByProduct = async (
    productId: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc'
): Promise<ReviewListResponse> => {
    const response = await axiosClient.get<ApiResponse<ReviewListResponse>>(
        `${REVIEWS_API}/products/${productId}`,
        {
            params: { page, size, sort },
        }
    );
    return response.data.data;
};

/**
 * Get all reviews (Admin) with optional search
 */
export const searchReviews = async (
    keyword?: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc'
): Promise<ReviewListResponse> => {
    const response = await axiosClient.get<ApiResponse<ReviewListResponse>>(
        REVIEWS_API,
        {
            params: { keyword, page, size, sort },
        }
    );
    return response.data.data;
};

/**
 * Get review by ID
 */
export const getReviewById = async (id: number): Promise<ReviewResponse> => {
    const response = await axiosClient.get<ApiResponse<ReviewResponse>>(
        `${REVIEWS_API}/${id}`
    );
    return response.data.data;
};

/**
 * Update a review (only owner can update)
 */
export const updateReview = async (
    id: number,
    request: CreateReviewRequest
): Promise<ReviewResponse> => {
    const response = await axiosClient.put<ApiResponse<ReviewResponse>>(
        `${REVIEWS_API}/${id}`,
        request
    );
    return response.data.data;
};

/**
 * Delete a review (owner or admin)
 */
export const deleteReview = async (id: number): Promise<void> => {
    await axiosClient.delete(`${REVIEWS_API}/${id}`);
};

/**
 * Get review statistics for a product
 */
export const getReviewStats = async (
    productId: number
): Promise<ReviewStatistics> => {
    const response = await axiosClient.get<ApiResponse<ReviewStatistics>>(
        `${REVIEWS_API}/products/${productId}/stats`
    );
    return response.data.data;
};

/**
 * Get my review history (User)
 */
export interface MyReviewResponse {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    productId?: number;
    productName?: string;
    productThumbnail?: string;
}

export interface MyReviewsListResponse {
    content: MyReviewResponse[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

export const getMyReviews = async (
    page: number = 0,
    size: number = 10
): Promise<MyReviewsListResponse> => {
    const response = await axiosClient.get<ApiResponse<MyReviewsListResponse>>(
        `${REVIEWS_API}/my-reviews`,
        {
            params: { page, size, sort: 'createdAt,desc' },
        }
    );
    return response.data.data;
};
