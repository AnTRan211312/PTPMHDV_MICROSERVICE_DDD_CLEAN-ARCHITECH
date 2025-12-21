import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/apiResponse";
import type { NotificationListResponse } from "@/types/notification";

// ========== USER NOTIFICATIONS ==========

export const getNotifications = (page: number, size: number) => {
    return axiosClient.get<ApiResponse<NotificationListResponse>>(
        `/notifications?page=${page}&size=${size}`
    );
};

export const markAsRead = (id: number) => {
    return axiosClient.put<ApiResponse<void>>(`/notifications/${id}/read`);
};

export const markAllAsRead = () => {
    return axiosClient.put<ApiResponse<void>>(`/notifications/read-all`);
};

// ========== ADMIN NOTIFICATIONS ==========

export const getAdminNotifications = (page: number, size: number) => {
    return axiosClient.get<ApiResponse<NotificationListResponse>>(
        `/notifications/admin?page=${page}&size=${size}`
    );
};

export const getAdminUnreadCount = () => {
    return axiosClient.get<ApiResponse<{ unreadCount: number }>>(
        `/notifications/admin/count`
    );
};

export const markAllAdminAsRead = () => {
    return axiosClient.put<ApiResponse<void>>(`/notifications/admin/read-all`);
};
