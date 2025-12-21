import { useEffect, useState } from "react";
import { getNotifications, markAllAsRead, markAsRead } from "@/services/notificationApi";
import type { NotificationResponse } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCheck, Package, CreditCard, XCircle, CheckCircle2, Truck, ShoppingBag } from "lucide-react";

// --- Helpers ---

// Format VND: 96820000.00 -> 96.820.000 đ
const formatCurrency = (amountStr: string | number): string => {
    // Extract number from string if needed, handle "27570000.00 VND"
    const amount = typeof amountStr === 'string'
        ? parseFloat(amountStr.replace(/[^\d.-]/g, ''))
        : amountStr;

    if (isNaN(amount)) return String(amountStr);

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0 // No decimals
    }).format(amount);
};

// Relative Time: "5 phút trước" or "10:30 19/12"
const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Vừa xong";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;

    // HH:mm dd/MM/yyyy
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

// Deduplicate notifications
const deduplicateNotifications = (notifs: NotificationResponse[]) => {
    const seen = new Set();
    return notifs.filter(n => {
        // Create a unique key based on content and approximate time (ignore seconds/millis for dupe check)
        // If "Payment Success" and "Order Paid" appear at same time, we might want to keep both IF they are distinct types.
        // User complained about "Thanh toán thành công" appearing twice.
        const timeKey = new Date(n.createdAt).getMinutes(); // Group by minute
        const key = `${n.title}-${n.message}-${timeKey}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

// Determine Icon & Color based on content
const getNotificationStyle = (title: string, message: string) => {
    const lowerTitle = title.toLowerCase();
    const lowerMsg = message.toLowerCase();

    // ERROR / FAILURE
    if (lowerTitle.includes("hủy") || lowerTitle.includes("thất bại") || lowerTitle.includes("lỗi")) {
        return {
            icon: <XCircle className="h-6 w-6 text-red-600" />,
            titleColor: "text-red-700",
            bgColor: "bg-red-100",
            borderColor: "border-red-200"
        };
    }

    // SUCCESS / COMPLETE
    if (lowerTitle.includes("thành công") || lowerTitle.includes("hoàn tất") || lowerTitle.includes("hoàn thành") || lowerTitle.includes("đã thanh toán")) {
        return {
            icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
            titleColor: "text-green-700",
            bgColor: "bg-green-100",
            borderColor: "border-green-200"
        };
    }

    // SHIPPING
    if (lowerTitle.includes("giao") || lowerTitle.includes("vận chuyển") || lowerTitle.includes("đường")) {
        return {
            icon: <Truck className="h-6 w-6 text-blue-600" />,
            titleColor: "text-blue-700",
            bgColor: "bg-blue-100",
            borderColor: "border-blue-200"
        };
    }

    // SHOPPING CART
    if (lowerTitle.includes("giỏ hàng") || lowerMsg.includes("giỏ hàng")) {
        return {
            icon: <ShoppingBag className="h-6 w-6 text-orange-600" />,
            titleColor: "text-gray-900", // Keep title neutral or orange
            bgColor: "bg-orange-100",
            borderColor: "border-orange-200"
        };
    }

    // PAYMENT PENDING
    if (lowerTitle.includes("thanh toán") || lowerMsg.includes("thanh toán")) {
        return {
            icon: <CreditCard className="h-6 w-6 text-yellow-600" />,
            titleColor: "text-gray-900",
            bgColor: "bg-yellow-100",
            borderColor: "border-yellow-200"
        };
    }

    // DEFAULT
    return {
        icon: <Package className="h-6 w-6 text-gray-500" />,
        titleColor: "text-gray-900",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200"
    };
};

const NotificationPage = () => {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const fetchNotifications = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await getNotifications(pageNum - 1, 10);
            const rawNotifs = res.data.data?.content || [];
            const uniqueNotifs = deduplicateNotifications(rawNotifs);

            setNotifications(uniqueNotifs);
            setTotalPages(res.data.data?.totalPages || 1);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(1);
    }, []);

    const handleMarkAsRead = async (id: number, referenceId: string, type: string) => {
        try {
            await markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));

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
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const processMessage = (msg: string) => {
        let cleanMsg = msg.replace("Vui lòng chú ý điện thoại!", "").trim();
        cleanMsg = cleanMsg.replace(/\d+(\.\d{1,2})? VND/g, (match) => formatCurrency(match));
        return cleanMsg;
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 lg:p-6 min-h-screen font-sans">
            <Card className="border-none shadow-[0_1px_4px_rgba(0,0,0,0.05)] bg-white overflow-hidden rounded-md">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-6 py-4 bg-white sticky top-0 z-10">
                    <CardTitle className="text-lg font-medium text-gray-800">Thông báo</CardTitle>
                    {notifications.length > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-sm text-gray-500 hover:text-orange-600 font-normal transition-colors flex items-center gap-1"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Đánh dấu đã đọc tất cả
                        </button>
                    )}
                </CardHeader>
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                            <p className="text-gray-500 text-sm">Đang tải...</p>
                        </div>
                    ) : notifications?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                <Package className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium">Chưa có thông báo</h3>
                            <p className="text-gray-500 text-sm mt-1">Các cập nhật đơn hàng sẽ hiển thị tại đây.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications?.map((notification) => {
                                const style = getNotificationStyle(notification.title, notification.message);
                                const isUnread = !notification.read;
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "group relative flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer",
                                            isUnread ? "bg-[#fffbf8]" : "bg-white"
                                        )}
                                        onClick={() => handleMarkAsRead(notification.id, notification.referenceId, notification.type)}
                                    >
                                        {/* Status Icon */}
                                        <div className="relative">
                                            <div className={cn(
                                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border",
                                                style.bgColor,
                                                style.borderColor
                                            )}>
                                                {style.icon}
                                            </div>
                                            {isUnread && (
                                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-600 border-2 border-white shadow-sm" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <h4 className={cn("text-[15px] font-medium leading-5 mb-1 text-gray-900")}>
                                                {notification.title}
                                            </h4>
                                            <p className={cn(
                                                "text-sm leading-relaxed text-gray-600 line-clamp-2"
                                            )}>
                                                {processMessage(notification.message)}
                                            </p>
                                            <span className="block mt-2 text-xs text-gray-400 font-normal">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>

                                        {/* Optional: View details chevron or button showing on hover can go here */}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex justify-center pb-6">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => fetchNotifications(page - 1)}
                                className="h-8 px-4 bg-white hover:bg-white hover:border-orange-500 hover:text-orange-500 transition-all font-normal"
                            >
                                Trước
                            </Button>
                            <span className="flex items-center px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md">
                                {page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => fetchNotifications(page + 1)}
                                className="h-8 px-4 bg-white hover:bg-white hover:border-orange-500 hover:text-orange-500 transition-all font-normal"
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default NotificationPage;
