// =========================================================================
// Dashboard Statistics Types
// =========================================================================

/**
 * Thống kê sản phẩm (từ Product Service)
 */
export interface ProductStatsResponse {
    totalProducts: number;
    topProducts: TopProduct[];
}

export interface TopProduct {
    productId: number;
    productName: string;
    thumbnail: string;
    salesCount: number;
    averageRating: number | null;
}

/**
 * Thống kê người dùng (từ Auth Service)
 */
export interface UserStatsResponse {
    totalUsers: number;
}

/**
 * Thống kê thanh toán/doanh thu (từ Payment Service)
 */
export interface PaymentStatsResponse {
    totalRevenue: number;
    dailyRevenue: DailyRevenue[];
}

export interface DailyRevenue {
    date: string; // ISO date string
    label: string; // "T1", "T2", ...
    revenue: number;
    orderCount: number;
}

/**
 * Thống kê đánh giá (từ Product Service - Reviews)
 */
export interface ReviewStatsResponse {
    totalReviews: number;
    averageRating: number;
}

/**
 * Tổng hợp thống kê Dashboard
 */
export interface DashboardStats {
    products: ProductStatsResponse;
    users: UserStatsResponse;
    orders: import("./order.d.ts").OrderStatsResponse;
    payments: PaymentStatsResponse;
    reviews: ReviewStatsResponse;
}
