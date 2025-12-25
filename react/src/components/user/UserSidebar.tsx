import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { User, Package, Bell, Ticket, MessageSquare } from "lucide-react";

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    href: string;
    children?: { label: string; href: string }[];
}

const UserSidebar = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user } = useSelector((state: any) => state.auth);
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const sidebarItems: SidebarItem[] = [
        {
            icon: User,
            label: "Tài khoản của tôi",
            href: "/user/info",
            children: [
                { label: "Hồ sơ", href: "/user/info" },
                { label: "Ngân hàng", href: "/user/info" },
                { label: "Địa chỉ", href: "/user/info" },
                { label: "Đổi mật khẩu", href: "/user/info" }
            ]
        },
        { icon: Package, label: "Đơn mua", href: "/user/orders" },
        { icon: MessageSquare, label: "Đánh giá của tôi", href: "/user/reviews" },
        { icon: Bell, label: "Thông báo", href: "/user/notifications" },
        { icon: Ticket, label: "Kho Voucher", href: "/user/info" },
    ];

    // Get Avatar version for cache busting (optional, matching existing logic)
    const avatarVersion = user?.updatedAt ? new Date(user.updatedAt).getTime() : 0;

    return (
        <div className="space-y-4">
            {/* Profile Summary */}
            <div className="flex items-center gap-3 pl-2 py-2 border-b border-gray-200/50 pb-4">
                <Link to="/user/profile" className="h-12 w-12 rounded-full border border-gray-200 overflow-hidden shrink-0 cursor-pointer hover:opacity-90">
                    <img
                        src={user?.logoUrl ? `${user.logoUrl}?v=${avatarVersion}` : "https://github.com/shadcn.png"}
                        alt={user?.name}
                        className="h-full w-full object-cover"
                    />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-sm">{user?.name || "User"}</div>
                    <Link to="/user/info" className="text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" />
                        Sửa hồ sơ
                    </Link>
                </div>
            </div>

            {/* Navigation List */}
            <div className="space-y-1">
                {sidebarItems.map((item, idx) => {
                    const active = isActive(item.href);

                    return (
                        <div key={idx}>
                            {item.children ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:text-orange-600">
                                        <div className="w-6 flex justify-center text-blue-600">
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                    <div className="pl-11 space-y-1">
                                        {item.children.map((child, childIdx) => {
                                            const isChildActive = isActive(child.href);
                                            return (
                                                <Link
                                                    key={childIdx}
                                                    to={child.href}
                                                    className={`block py-1 text-sm transition-colors ${isChildActive
                                                        ? "text-orange-600 font-medium"
                                                        : "text-gray-500 hover:text-orange-600"
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to={item.href}
                                    className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${active ? "text-orange-600" : "text-gray-700 hover:text-orange-600"
                                        }`}
                                >
                                    <div
                                        className={`w-6 flex justify-center ${active ? "text-orange-600" : "text-blue-600"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span>{item.label}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserSidebar;
