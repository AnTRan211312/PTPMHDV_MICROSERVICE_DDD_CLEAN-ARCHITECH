import { useEffect, useState } from "react";
import {
    Bell,
    Clock,
    Package,
    CreditCard,
    AlertTriangle,
    Timer,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getAdminNotifications,
    markAllAdminAsRead,
    markAsRead,
} from "@/services/notificationApi";
import type { NotificationResponse } from "@/types/notification";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Format relative time
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
};

// Get icon and color based on notification content
const getNotificationStyle = (title: string, message: string) => {
    const lowerTitle = title.toLowerCase();
    const lowerMessage = message.toLowerCase();

    // Đơn hàng mới
    if (lowerTitle.includes("đơn hàng mới") || lowerTitle.includes("📦")) {
        return {
            icon: Package,
            bgColor: "bg-blue-100",
            iconColor: "text-blue-600",
            borderColor: "border-l-blue-500",
        };
    }

    // Thanh toán thành công
    if (
        lowerTitle.includes("thanh toán") ||
        lowerTitle.includes("💰") ||
        lowerMessage.includes("thanh toán")
    ) {
        return {
            icon: CreditCard,
            bgColor: "bg-green-100",
            iconColor: "text-green-600",
            borderColor: "border-l-green-500",
        };
    }

    // Đơn hàng hết hạn
    if (lowerTitle.includes("hết hạn") || lowerTitle.includes("⏰")) {
        return {
            icon: Timer,
            bgColor: "bg-orange-100",
            iconColor: "text-orange-600",
            borderColor: "border-l-orange-500",
        };
    }

    // Tồn kho thấp
    if (
        lowerTitle.includes("tồn kho") ||
        lowerMessage.includes("sắp hết") ||
        lowerMessage.includes("hết hàng")
    ) {
        return {
            icon: AlertTriangle,
            bgColor: "bg-red-100",
            iconColor: "text-red-600",
            borderColor: "border-l-red-500",
        };
    }

    // Default
    return {
        icon: Bell,
        bgColor: "bg-gray-100",
        iconColor: "text-gray-600",
        borderColor: "border-l-gray-400",
    };
};

export function AdminNotificationBell() {
    const [notifications, setNotifications] = useState<NotificationResponse[]>(
        []
    );
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await getAdminNotifications(0, 15);
            const content = res.data.data?.content || [];
            const actualUnread = content.filter(
                (n: NotificationResponse) => !n.read
            ).length;

            setNotifications(content);
            setUnreadCount(actualUnread);
        } catch (error) {
            console.error("Failed to fetch admin notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            void fetchNotifications();
        }
    };

    const handleMarkAsRead = async (
        id: number,
        referenceId: string,
        type: string
    ) => {
        try {
            await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Navigate to appropriate page
            if (type === "ORDER") {
                navigate("/admin/orders");
            } else if (type === "INVENTORY") {
                navigate("/admin/inventory");
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAdminAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button className="relative flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-sm animate-pulse">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[420px] p-0 bg-white border border-gray-200 shadow-2xl rounded-lg overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-white" />
                        <span className="font-semibold text-white">
                            Thông báo hệ thống
                        </span>
                        {unreadCount > 0 && (
                            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount} mới
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-medium text-white/80 hover:text-white hover:underline"
                        >
                            Đánh dấu đã đọc
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 className="h-8 w-8 text-green-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                                Không có thông báo mới
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Bạn đã cập nhật tất cả
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications?.map((notification) => {
                                const style = getNotificationStyle(
                                    notification.title,
                                    notification.message
                                );
                                const IconComponent = style.icon;

                                return (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-3 p-3 cursor-pointer rounded-none focus:bg-gray-50 border-l-4",
                                            style.borderColor,
                                            !notification.read && "bg-blue-50/50"
                                        )}
                                        onClick={() =>
                                            handleMarkAsRead(
                                                notification.id,
                                                notification.referenceId,
                                                notification.type
                                            )
                                        }
                                    >
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                                style.bgColor
                                            )}
                                        >
                                            <IconComponent
                                                className={cn(
                                                    "w-5 h-5",
                                                    style.iconColor
                                                )}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        "text-sm leading-snug",
                                                        !notification.read
                                                            ? "font-semibold text-gray-900"
                                                            : "font-normal text-gray-700"
                                                    )}
                                                >
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] text-gray-400">
                                                    {formatRelativeTime(
                                                        notification.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100">
                    <Button
                        variant="ghost"
                        className="w-full h-10 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-none"
                        onClick={() => {
                            setIsOpen(false);
                            // Navigate to admin notifications page if exists
                            navigate("/admin/orders");
                        }}
                    >
                        Xem tất cả đơn hàng
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
