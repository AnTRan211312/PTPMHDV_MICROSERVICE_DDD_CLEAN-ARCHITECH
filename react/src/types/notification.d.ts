import type { PageResponseDto } from "@/types/apiResponse";

export interface NotificationResponse {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    referenceId: string;
    createdAt: string;
}

export interface NotificationListResponse extends PageResponseDto<NotificationResponse> {
    unreadCount: number;
}
