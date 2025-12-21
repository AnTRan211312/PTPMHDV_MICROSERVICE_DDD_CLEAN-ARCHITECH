import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
    PageResponseDto,

} from "@/types/apiResponse.d.ts";
import type {
    OrderResponse,
    CheckoutSelectedRequest,
    OrderStatsResponse,
} from "@/types/order.d.ts";

export const checkout = () => {
    return axiosClient.post<ApiResponse<OrderResponse>>(
        "/orders/checkout"
    );
};

export const checkoutSelected = (data: CheckoutSelectedRequest) => {
    return axiosClient.post<ApiResponse<OrderResponse>>(
        "/orders/checkout-selected",
        data
    );
};

export const getOrder = (orderId: number) => {
    return axiosClient.get<ApiResponse<OrderResponse>>(
        `/orders/${orderId}`
    );
};

export const cancelOrder = (orderId: number) => {
    return axiosClient.post<ApiResponse<OrderResponse>>(
        `/orders/${orderId}/cancel`
    );
};

export const getOrderHistory = (page: number = 0, size: number = 10) => {
    return axiosClient.get<ApiResponse<PageResponseDto<OrderResponse>>>(
        `/orders/history?page=${page}&size=${size}`
    );
};

export const getOrdersByStatus = (status: string, page: number = 0, size: number = 10) => {
    return axiosClient.get<ApiResponse<PageResponseDto<OrderResponse>>>(
        `/orders/status/${status}?page=${page}&size=${size}`
    );
};

// Admin - Lấy tất cả đơn hàng (hỗ trợ tìm kiếm theo keyword và filter theo status)
export const getAllOrders = (page: number = 0, size: number = 10, keyword?: string, status?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (keyword && keyword.trim()) {
        params.append("keyword", keyword.trim());
    }
    if (status && status.trim() && status !== "ALL") {
        params.append("status", status.trim());
    }
    return axiosClient.get<ApiResponse<PageResponseDto<OrderResponse>>>(
        `/orders/admin/all?${params.toString()}`
    );
};

export const getAdminOrdersByStatus = (status: string, page: number = 0, size: number = 10) => {
    return axiosClient.get<ApiResponse<PageResponseDto<OrderResponse>>>(
        `/orders/admin/status/${status}?page=${page}&size=${size}`
    );
};

export const updateOrderStatus = (orderId: number, status: string) => {
    return axiosClient.put<ApiResponse<OrderResponse>>(
        `/orders/admin/${orderId}/status`,
        { status }
    );
};

// Admin - Lấy thống kê đơn hàng
export const getOrderStats = () => {
    return axiosClient.get<ApiResponse<OrderStatsResponse>>("/orders/admin/stats");
};
