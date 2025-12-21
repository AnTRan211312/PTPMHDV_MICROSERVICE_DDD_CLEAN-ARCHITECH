import { useCallback, useEffect, useState } from "react";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Warehouse,
    CreditCard,
    Bell,
    ShieldCheck,
    KeyRound,
    UserCog,
    Home,
    ChevronRight,
    Store,
    FolderTree,
    Activity,
    ShoppingBag,
    LineChart,
    type LucideIcon,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/features/hooks.ts";

interface MenuItem {
    title: string;
    url?: string;
    icon: LucideIcon;
    permission?: string;
    children?: {
        title: string;
        url: string;
        icon?: LucideIcon;
        permission?: string;
    }[];
}

const menuItems: MenuItem[] = [
    {
        title: "Tổng quan",
        url: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Danh mục",
        url: "/admin/categories",
        icon: FolderTree,
        permission: "POST /api/categories",
    },
    {
        title: "Sản phẩm",
        url: "/admin/products",
        icon: Package,
        permission: "POST /api/products",
    },
    {
        title: "Đánh giá",
        url: "/admin/reviews",
        icon: Activity,
        permission: "DELETE /api/reviews/{id}",
    },
    {
        title: "Quản lý Tồn kho",
        url: "/admin/inventory",
        icon: Warehouse,
        permission: "GET /api/inventory",
    },
    {
        title: "Quản lý Giỏ hàng",
        url: "/admin/carts",
        icon: ShoppingBag,
        permission: "GET /api/carts/admin/all",
    },
    {
        title: "Đơn hàng",
        url: "/admin/orders",
        icon: ShoppingCart,
        permission: "GET /api/orders/admin/all",
    },
    {
        title: "Thanh toán",
        url: "/admin/payments",
        icon: CreditCard,
        permission: "GET /api/payments",
    },
    {
        title: "Người dùng",
        url: "/admin/users",
        icon: Users,
        permission: "GET /api/users",
    },
    {
        title: "Thông báo",
        url: "/admin/notifications",
        icon: Bell,
        permission: "GET /api/notifications",
    },
    {
        title: "Giám sát Hệ thống",
        url: "/admin/monitor/dashboard",
        icon: LineChart,
        permission: "GET /api/monitor/metrics/dashboard",
    },
    {
        title: "Phân quyền",
        icon: ShieldCheck,
        children: [
            {
                title: "Quyền hạn",
                url: "/admin/access-control/permissions",
                icon: KeyRound,
                permission: "GET /api/permissions",
            },
            {
                title: "Vai trò",
                url: "/admin/access-control/roles",
                icon: UserCog,
                permission: "GET /api/roles",
            },
        ],
    },
];

export function AdminSidebar() {
    const { pathname } = useLocation();
    const permissions =
        useAppSelector((state) => state.auth.user?.permissions) ?? [];

    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [...prev, title],
        );
    };

    const isItemActive = (item: MenuItem): boolean => {
        if (item.url) {
            return pathname === item.url || pathname.startsWith(item.url + "/");
        }
        if (item.children) {
            return item.children.some(
                (child) =>
                    pathname === child.url || pathname.startsWith(child.url + "/"),
            );
        }
        return false;
    };

    const isChildActive = useCallback(
        (childUrl: string): boolean =>
            pathname === childUrl || pathname.startsWith(childUrl + "/"),
        [pathname],
    );

    useEffect(() => {
        menuItems.forEach((item) => {
            if (
                item.children &&
                item.children.some((child) => isChildActive(child.url))
            ) {
                setExpandedItems((prev) =>
                    prev.includes(item.title) ? prev : [...prev, item.title],
                );
            }
        });
    }, [pathname, isChildActive]);

    return (
        <Sidebar className="border-r border-blue-100 bg-gradient-to-b from-blue-50/30 to-white">
            {/* HEADER */}
            <div className="flex h-16 items-center border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded border border-white/30 bg-white/20">
                        <Store className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-semibold text-white">E-COMMERCE</span>
                        <p className="text-xs text-blue-100">Quản trị hệ thống</p>
                    </div>
                </div>
            </div>

            <SidebarContent className="px-3 py-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {menuItems
                                .filter(
                                    (item) =>
                                        !item.permission || permissions.includes(item.permission),
                                )
                                .map((item) => {
                                    const isActive = isItemActive(item);
                                    const isExpanded = expandedItems.includes(item.title);
                                    const hasChildren = item.children && item.children.length > 0;
                                    const filteredChildren = item.children?.filter(
                                        (child) =>
                                            !child.permission ||
                                            permissions.includes(child.permission),
                                    );

                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            {hasChildren && (
                                                <>
                                                    <div
                                                        onClick={() => toggleExpanded(item.title)}
                                                        className={cn(
                                                            "flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                            isActive
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "text-gray-600 hover:bg-slate-50 hover:text-slate-900",
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <item.icon className="h-4 w-4" />
                                                            <span>{item.title}</span>
                                                        </div>
                                                        <ChevronRight
                                                            className={cn(
                                                                "h-4 w-4",
                                                                isExpanded ? "rotate-90" : "rotate-0",
                                                            )}
                                                        />
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="mt-1 ml-6 space-y-1 border-l border-gray-200 pl-3">
                                                            {filteredChildren?.map((child) => (
                                                                <SidebarMenuButton
                                                                    asChild
                                                                    key={child.title}
                                                                    isActive={isChildActive(child.url)}
                                                                    className={cn(
                                                                        "w-full justify-start rounded-md py-2 text-sm",
                                                                        isChildActive(child.url)
                                                                            ? "bg-blue-100 text-blue-800"
                                                                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-700",
                                                                    )}
                                                                >
                                                                    <Link
                                                                        to={child.url}
                                                                        className="flex w-full items-center gap-3"
                                                                    >
                                                                        {child.icon ? (
                                                                            <child.icon className="h-4 w-4" />
                                                                        ) : (
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                                                                        )}
                                                                        <span>{child.title}</span>
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {!hasChildren && (
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    className={cn(
                                                        "w-full justify-start rounded-md py-2 text-sm font-medium transition-colors",
                                                        isActive
                                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                                            : "text-gray-600 hover:bg-slate-50 hover:text-slate-900",
                                                    )}
                                                >
                                                    <Link
                                                        to={item.url!}
                                                        className="flex w-full items-center gap-3"
                                                    >
                                                        <item.icon
                                                            className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")}
                                                        />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-blue-100 px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full justify-start rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <Link to="/" className="flex w-full items-center gap-3">
                                <Home className="h-4 w-4" />
                                <span>Quay về trang chủ</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
