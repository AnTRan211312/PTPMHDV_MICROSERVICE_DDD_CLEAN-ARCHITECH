import { useLocation } from "react-router-dom";
import { Clock } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppSelector } from "@/features/hooks";
import UserMenu from "@/page/commons/UserMenu.tsx";
import { AdminNotificationBell } from "./AdminNotificationBell";

const routeTitles: Record<
    string,
    { title: string; subtitle?: string; icon?: string }
> = {
    "/admin": {
        title: "Dashboard",
        subtitle: "Tổng quan hệ thống",
        icon: "📊",
    },
    "/admin/categories": {
        title: "Quản lý danh mục",
        subtitle: "Danh sách danh mục sản phẩm",
        icon: "📁",
    },
    "/admin/products": {
        title: "Quản lý sản phẩm",
        subtitle: "Danh sách và thông tin sản phẩm",
        icon: "📦",
    },
    "/admin/reviews": {
        title: "Quản lý đánh giá",
        subtitle: "Xem và quản lý đánh giá sản phẩm",
        icon: "⭐",
    },
    "/admin/orders": {
        title: "Quản lý đơn hàng",
        subtitle: "Theo dõi và xử lý đơn hàng",
        icon: "🛒",
    },
    "/admin/inventory": {
        title: "Quản lý kho hàng",
        subtitle: "Tồn kho và nhập xuất",
        icon: "🏪",
    },
    "/admin/payments": {
        title: "Quản lý thanh toán",
        subtitle: "Giao dịch và doanh thu",
        icon: "💳",
    },
    "/admin/users": {
        title: "Quản lý người dùng",
        subtitle: "Tài khoản và phân quyền",
        icon: "👥",
    },
    "/admin/notifications": {
        title: "Quản lý thông báo",
        subtitle: "Gửi và theo dõi thông báo",
        icon: "🔔",
    },
    "/admin/access-control/permissions": {
        title: "Phân quyền",
        subtitle: "Quản lý quyền truy cập",
        icon: "🔐",
    },
    "/admin/access-control/roles": {
        title: "Vai trò",
        subtitle: "Chỉnh sửa quyền cho vai trò",
        icon: "👤",
    },
};

export function AdminTopBar() {
    const { isLogin } = useAppSelector((state) => state.auth);
    const location = useLocation();

    const currentRoute = routeTitles[location.pathname] || {
        title: "Admin",
        subtitle: "Quản trị hệ thống",
    };

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-6 shadow-sm backdrop-blur-md">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <SidebarTrigger
                    className={`transition-colors hover:bg-blue-50 hover:text-blue-600 lg:hidden`}
                />
                <div className="flex items-center gap-3">
                    {currentRoute.icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                            <span className="text-lg">{currentRoute.icon}</span>
                        </div>
                    )}
                    <div>
                        <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-gray-900">
                            {currentRoute.title}
                        </h1>
                        {currentRoute.subtitle && (
                            <p className="text-sm font-medium text-gray-500">
                                {currentRoute.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Center */}
            <div className="flex w-1/3 justify-center">
                <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {new Date().toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>

            {/* Right side */}
            {isLogin && (
                <div className="flex items-center gap-3">
                    <AdminNotificationBell />
                    <div className="h-6 w-px bg-gray-200" />
                    <UserMenu blackTheme />
                </div>
            )}
        </header>
    );
}
