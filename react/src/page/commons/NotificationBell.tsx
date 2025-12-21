import { useEffect, useState } from "react";
import { Bell, Clock, ShoppingBag, Truck, CheckCircle, CreditCard, Package } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/features/store";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markAllAsRead, markAsRead } from "@/services/notificationApi";
import type { NotificationResponse } from "@/types/notification";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Format relative time like Shopee
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
    return date.toLocaleDateString('vi-VN');
};

// Get icon and color based on notification type/title
const getNotificationStyle = (title: string, type: string) => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("giỏ hàng") || lowerTitle.includes("thêm vào")) {
        return { icon: ShoppingBag, bgColor: "bg-orange-100", iconColor: "text-[#ee4d2d]" };
    }
    if (lowerTitle.includes("đang giao") || lowerTitle.includes("vận chuyển") || lowerTitle.includes("shipping")) {
        return { icon: Truck, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
    }
    if (lowerTitle.includes("hoàn thành") || lowerTitle.includes("thành công") || lowerTitle.includes("complete")) {
        return { icon: CheckCircle, bgColor: "bg-green-100", iconColor: "text-green-600" };
    }
    if (type === "PAYMENT" || lowerTitle.includes("thanh toán")) {
        return { icon: CreditCard, bgColor: "bg-purple-100", iconColor: "text-purple-600" };
    }
    if (type === "ORDER" || lowerTitle.includes("đơn hàng")) {
        return { icon: Package, bgColor: "bg-cyan-100", iconColor: "text-cyan-600" };
    }
    return { icon: Bell, bgColor: "bg-gray-100", iconColor: "text-gray-600" };
};

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const cartItemsCount = useSelector((state: RootState) => state.cart.cart?.totalItems || 0);

    // Unified fetch function
    const fetchNotifications = async () => {
        try {
            const res = await getNotifications(0, 10); // Get top 10 for accurate count
            const content = res.data.data?.content || [];

            // Count actual unread from content (not relying on API unreadCount)
            const actualUnread = content.filter((n: NotificationResponse) => !n.read).length;

            setNotifications(content);
            setUnreadCount(actualUnread);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (cartItemsCount > 0) {
            const timer = setTimeout(fetchNotifications, 1000);
            return () => clearTimeout(timer);
        }
    }, [cartItemsCount]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            void fetchNotifications();
        }
    };

    const handleMarkAsRead = async (id: number, referenceId: string, type: string) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (type === "ORDER" || type === "PAYMENT") {
                navigate(`/user/orders/${referenceId}`);
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button className="relative flex items-center justify-center p-1.5 hover:bg-white/10 rounded-full transition">
                    <Bell className="h-6 w-6 text-white" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white text-[#ee4d2d] text-[10px] font-bold px-1 shadow-sm">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[380px] p-0 bg-white border border-gray-200 shadow-xl rounded-sm overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-bold text-lg text-gray-900">Thông báo</span>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-medium text-[#ee4d2d] hover:underline"
                        >
                            Đã đọc tất cả
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[350px] overflow-y-auto">
                    {notifications?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <Bell className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Chưa có thông báo</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications?.map((notification) => {
                                const style = getNotificationStyle(notification.title, notification.type);
                                const IconComponent = style.icon;

                                return (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-3 p-3 cursor-pointer rounded-none focus:bg-gray-50",
                                            !notification.read && "bg-orange-50/50"
                                        )}
                                        onClick={() => handleMarkAsRead(notification.id, notification.referenceId, notification.type)}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                            style.bgColor
                                        )}>
                                            <IconComponent className={cn("w-5 h-5", style.iconColor)} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm leading-snug",
                                                    !notification.read ? "font-semibold text-gray-900" : "font-normal text-gray-700"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ee4d2d] mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] text-gray-400">
                                                    {formatRelativeTime(notification.createdAt)}
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
                        className="w-full h-10 text-sm font-medium text-[#ee4d2d] hover:text-[#d04126] hover:bg-orange-50 rounded-none"
                        onClick={() => {
                            setIsOpen(false);
                            navigate("/user/notifications");
                        }}
                    >
                        Xem tất cả
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
