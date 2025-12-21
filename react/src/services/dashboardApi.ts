import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/apiResponse.d.ts";
import type {
    ProductStatsResponse,
    UserStatsResponse,
    PaymentStatsResponse,
    ReviewStatsResponse,
} from "@/types/dashboard.d.ts";
import type { OrderStatsResponse } from "@/types/order.d.ts";

// =========================================================================
// Dashboard Statistics APIs
// =========================================================================

/**
 * Lấy thống kê sản phẩm (Admin)
 * GET /api/products/admin/stats
 */
export const getProductStats = () => {
    return axiosClient.get<ApiResponse<ProductStatsResponse>>("/products/admin/stats");
};

/**
 * Lấy thống kê người dùng (Admin)
 * GET /api/users/admin/stats
 */
export const getUserStats = () => {
    return axiosClient.get<ApiResponse<UserStatsResponse>>("/users/admin/stats");
};

/**
 * Lấy thống kê đơn hàng (Admin)
 * GET /api/orders/admin/stats
 */
export const getOrderStats = () => {
    return axiosClient.get<ApiResponse<OrderStatsResponse>>("/orders/admin/stats");
};

/**
 * Lấy thống kê doanh thu (Admin)
 * GET /api/payments/admin/stats
 */
export const getPaymentStats = () => {
    return axiosClient.get<ApiResponse<PaymentStatsResponse>>("/payments/admin/stats");
};

/**
 * Lấy thống kê đánh giá (Admin)
 * GET /api/reviews/admin/stats
 */
export const getReviewStats = () => {
    return axiosClient.get<ApiResponse<ReviewStatsResponse>>("/reviews/admin/stats");
};

/**
 * Lấy tất cả thống kê cho Dashboard (gọi song song)
 */
export const getAllDashboardStats = async () => {
    const [productRes, userRes, orderRes, paymentRes, reviewRes] = await Promise.all([
        getProductStats(),
        getUserStats(),
        getOrderStats(),
        getPaymentStats(),
        getReviewStats(),
    ]);

    return {
        products: productRes.data.data,
        users: userRes.data.data,
        orders: orderRes.data.data,
        payments: paymentRes.data.data,
        reviews: reviewRes.data.data,
    };
};
