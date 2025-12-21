import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, XCircle, Truck, Filter, User as UserIcon, Search, Download, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    getAllOrders,
    getAdminOrdersByStatus,
    getOrder,
    updateOrderStatus,
    getOrderStats
} from "@/services/orderApi";
import { getUserById } from "@/services/userApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { OrderResponse, OrderStatsResponse } from "@/types/order";
import type { UserResponse } from "@/types/user";
import Pagination from "@/components/rickTexts/Pagination";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import { formatISO } from "@/utils/convertHelper";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-300",
    PAID: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300",
    CANCELLED: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-300",
    COMPLETED: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-300",
    SHIPPING: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-300",
    DELIVERED: "bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-300",
};

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
    ALL: "Tất cả trạng thái"
};

const statusIcons: Record<string, React.ReactNode> = {
    PENDING_PAYMENT: <Clock className="h-3.5 w-3.5" />,
    PAID: <CheckCircle className="h-3.5 w-3.5" />,
    CANCELLED: <XCircle className="h-3.5 w-3.5" />,
    SHIPPING: <Truck className="h-3.5 w-3.5" />,
    DELIVERED: <Package className="h-3.5 w-3.5" />,
    COMPLETED: <CheckCircle className="h-3.5 w-3.5" />,
};

export default function OrderManagementPage() {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [userMap, setUserMap] = useState<Record<number, UserResponse>>({});
    const [searchKeyword, setSearchKeyword] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Stats
    const [stats, setStats] = useState<OrderStatsResponse>({
        total: 0,
        pendingPayment: 0,
        paid: 0,
        shipping: 0,
        delivered: 0,
        completed: 0,
        cancelled: 0
    });

    const fetchOrders = async (page: number, size: number, status: string, keyword?: string) => {
        setIsLoading(true);
        try {
            // Sử dụng getAllOrders với keyword và status filter
            const statusParam = status === "ALL" ? undefined : status;
            const res = (await getAllOrders(page - 1, size, keyword || undefined, statusParam)).data.data;
            if (res) {
                setOrders(res.content || []);
                setTotalElements(res.totalElements || 0);
                setTotalPages(res.totalPages || 1);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải danh sách đơn hàng"));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = (await getOrderStats()).data.data;
            if (res) {
                setStats(res);
            }
        } catch (err) {
            console.error("Failed to fetch order stats:", err);
        }
    };

    // Fetch user details for orders
    useEffect(() => {
        const fetchUsers = async () => {
            const uniqueUserIds = Array.from(new Set(orders.map(o => o.userId)));
            const missingIds = uniqueUserIds.filter(id => !userMap[id]);

            if (missingIds.length === 0) return;

            const newUserMap = { ...userMap };
            await Promise.all(
                missingIds.map(async (id) => {
                    try {
                        const res = await getUserById(id);
                        if (res.data.data) {
                            newUserMap[id] = res.data.data;
                        }
                    } catch (error) {
                        console.error(`Failed to fetch user ${id}`, error);
                    }
                })
            );
            setUserMap(newUserMap);
        };

        if (orders.length > 0) {
            void fetchUsers();
        }
    }, [orders]);

    useEffect(() => {
        void fetchOrders(1, itemsPerPage, statusFilter, searchKeyword || undefined);
        void fetchStats();
        setCurrentPage(1);
    }, [itemsPerPage, statusFilter, searchKeyword]);

    useEffect(() => {
        void fetchOrders(currentPage, itemsPerPage, statusFilter, searchKeyword || undefined);
    }, [currentPage]);

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            toast.success("Cập nhật trạng thái thành công");
            void fetchOrders(currentPage, itemsPerPage, statusFilter);
            setSelectedOrder(null);
        } catch (error) {
            toast.error(getErrorMessage(error, "Cập nhật trạng thái thất bại"));
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // Stats mapping for tabs
    const getStatusCount = (status: string) => {
        if (status === "ALL") return stats.total;
        const key = status === "PENDING_PAYMENT" ? "pendingPayment" : status.toLowerCase();
        // @ts-ignore
        return stats[key] || 0;
    };

    const tabs = [
        { id: "ALL", label: "Tất cả" },
        { id: "PENDING_PAYMENT", label: "Chờ thanh toán" },
        { id: "PAID", label: "Đã thanh toán" },
        { id: "SHIPPING", label: "Đang giao" },
        { id: "DELIVERED", label: "Đã giao" },
        { id: "COMPLETED", label: "Hoàn thành" },
        { id: "CANCELLED", label: "Đã hủy" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý đơn hàng</h1>
                <p className="text-gray-500 mt-1">Theo dõi và xử lý các đơn hàng trong hệ thống</p>
            </div>

            {/* Main Content Card */}
            <Card className="border-gray-100 shadow-sm border-t-4 border-t-blue-600">
                <CardContent className="p-0">
                    {/* Toolbar & Tabs */}
                    <div className="border-b border-gray-100 bg-white">
                        {/* Status Tabs */}
                        <div className="flex overflow-x-auto hide-scrollbar px-4 pt-4 gap-6">
                            {tabs.map((tab) => {
                                const isActive = statusFilter === tab.id;
                                const count = getStatusCount(tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setStatusFilter(tab.id)}
                                        className={`flex items-center gap-2 pb-3 whitespace-nowrap text-sm font-medium transition-all relative border-b-2 px-1 ${isActive
                                            ? "text-blue-600 border-blue-600"
                                            : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        {tab.label}
                                        {count > 0 && (
                                            <Badge variant="secondary" className={`ml-1 px-1.5 py-0 text-[10px] h-4 min-w-[1.2rem] ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                                {count}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search & Actions Bar */}
                    <div className="p-4 bg-gray-50/30 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo mã đơn hàng..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="pl-9 bg-white border-gray-200 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        {searchKeyword && (
                            <Button
                                variant="ghost"
                                onClick={() => setSearchKeyword("")}
                                className="text-gray-500 hover:text-gray-900 hover:bg-transparent px-2 -ml-2"
                            >
                                Xóa
                            </Button>
                        )}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50">
                                <Filter className="mr-2 h-4 w-4" />
                                Bộ lọc khác
                            </Button>
                            <Button variant="outline" className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50">
                                <Download className="mr-2 h-4 w-4" />
                                Xuất Excel
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-100 border-b border-gray-200">
                                <TableRow className="hover:bg-transparent border-gray-200">
                                    <TableHead className="font-bold text-gray-700 w-[140px]">Mã đơn</TableHead>
                                    <TableHead className="font-bold text-gray-700">Khách hàng</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right">Số lượng</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right">Tổng tiền</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-center">Trạng thái</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-center">Ngày tạo</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right pr-6">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex justify-center">
                                                <LoadingSpinner />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-[300px]">
                                            <EmptyState
                                                title="Không tìm thấy đơn hàng"
                                                description="Thử thay đổi bộ lọc hoặc kiểm tra lại sau."
                                                icon={<Package className="mb-4 h-12 w-12 text-slate-300" />}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => {
                                        const user = userMap[order.userId];
                                        return (
                                            <TableRow key={order.orderId} className="group hover:bg-blue-50/50 even:bg-gray-50/50 transition-colors border-gray-100">
                                                <TableCell className="font-mono font-medium text-blue-600">
                                                    {order.orderCode}
                                                </TableCell>
                                                <TableCell>
                                                    {user ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-gray-900 text-sm">{user.name}</span>
                                                                <span className="text-xs text-gray-500">{user.phoneNumber || user.email}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                            <UserIcon className="h-4 w-4" />
                                                            <span>#{order.userId}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-gray-600 font-medium">
                                                    {order.totalItems}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums font-bold text-gray-900">
                                                    {formatPrice(order.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-200"} border shadow-sm px-2.5 py-0.5 rounded-full font-medium`}
                                                    >
                                                        {statusLabels[order.status] || order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-gray-500 tabular-nums whitespace-nowrap">
                                                    {formatISO(order.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right pr-4">
                                                    <Button
                                                        variant="ghost"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm"
                                                        onClick={() => setSelectedOrder(order)}
                                                    >
                                                        Xem chi tiết
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>



            {/* Pagination */}
            <div className="flex justify-end pt-4">
                <Pagination
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    showItemsPerPageSelect={true}
                />
            </div>

            {/* Order Detail Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden rounded-xl flex flex-col gap-0 border-none shadow-2xl">
                    {/* Fixed Header */}
                    <DialogHeader className="p-6 border-b border-slate-100 bg-white z-10">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-slate-900">Chi tiết đơn hàng</DialogTitle>
                            <Badge variant="outline" className="font-mono text-slate-500 bg-slate-50 border-slate-200">
                                {selectedOrder?.orderCode}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Body */}
                    {selectedOrder && (
                        <div className="flex-1 overflow-y-auto bg-slate-50/50">
                            {/* Order Status & Summary Bar */}
                            <div className="px-6 py-5 bg-white border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                {/* Left: Status & Date */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${statusColors[selectedOrder.status]} border px-2.5 py-0.5 rounded-full font-semibold`}>
                                            {statusLabels[selectedOrder.status]}
                                        </Badge>
                                        <span className="text-slate-300">|</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ngày tạo</span>
                                            <span className="text-sm font-medium text-slate-700">{formatISO(selectedOrder.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Total Amount */}
                                <div className="flex flex-col md:items-end">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Tổng thành tiền</span>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                        {formatPrice(selectedOrder.totalAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 p-6 items-stretch">
                                {/* Customer Info */}
                                {userMap[selectedOrder.userId] && (
                                    <Card className="border-slate-200/80 shadow-sm bg-white rounded-xl flex flex-col">
                                        <CardContent className="p-5 flex flex-col h-full">
                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <UserIcon className="h-3.5 w-3.5" />
                                                Thông tin khách hàng
                                            </h4>
                                            <div className="flex-1 space-y-3">
                                                {/* Avatar + Name */}
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm flex-shrink-0">
                                                        {userMap[selectedOrder.userId].logoUrl && (
                                                            <AvatarImage
                                                                src={userMap[selectedOrder.userId].logoUrl}
                                                                alt={userMap[selectedOrder.userId].name}
                                                            />
                                                        )}
                                                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-semibold text-sm">
                                                            {userMap[selectedOrder.userId].name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold text-slate-900 text-sm">{userMap[selectedOrder.userId].name}</p>
                                                </div>
                                                {/* Contact Info */}
                                                <div className="space-y-2 pl-1">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <span className="text-slate-400 w-12 flex-shrink-0">SĐT:</span>
                                                        <span>{userMap[selectedOrder.userId].phoneNumber || <span className="text-slate-400 italic">Chưa cập nhật</span>}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <span className="text-slate-400 w-12 flex-shrink-0">Email:</span>
                                                        <span className="truncate" title={userMap[selectedOrder.userId].email}>{userMap[selectedOrder.userId].email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Delivery Info */}
                                {userMap[selectedOrder.userId] && (
                                    <Card className="border-slate-200/80 shadow-sm bg-white rounded-xl flex flex-col">
                                        <CardContent className="p-5 flex flex-col h-full">
                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Truck className="h-3.5 w-3.5" />
                                                Thông tin giao nhận
                                            </h4>
                                            <div className="space-y-4 flex-1">
                                                <div>
                                                    <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Địa chỉ giao hàng</p>
                                                    {(userMap[selectedOrder.userId].address && userMap[selectedOrder.userId].address !== "string") ? (
                                                        <p className="text-sm font-medium text-slate-900 leading-snug break-words">
                                                            {userMap[selectedOrder.userId].address}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-slate-400 italic">
                                                            Khách hàng chưa cập nhật địa chỉ
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Phương thức thanh toán</p>
                                                    <div className="flex items-center gap-2">
                                                        {selectedOrder.status === "CANCELLED" ? (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                                <span className="text-sm font-medium text-slate-900">Đã hủy</span>
                                                            </>
                                                        ) : selectedOrder.status === "PENDING_PAYMENT" ? (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                                <span className="text-sm font-medium text-slate-900">Chờ thanh toán VNPay</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                                                <span className="text-sm font-medium text-slate-900">Đã thanh toán qua VNPay</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Items List */}
                            <div className="px-6 pb-6">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                                    Danh sách sản phẩm ({selectedOrder.totalItems})
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                                            <div className="h-16 w-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center">
                                                {item.productImage && item.productImage.trim() !== '' ? (
                                                    <img
                                                        src={item.productImage}
                                                        alt={item.productName}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                const fallback = parent.querySelector('.fallback-icon');
                                                                if (fallback) fallback.classList.remove('hidden');
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                                <Package className={`fallback-icon h-6 w-6 text-slate-300 ${item.productImage && item.productImage.trim() !== '' ? 'hidden' : ''}`} />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-semibold text-slate-900 text-sm truncate" title={item.productName}>
                                                            {item.productName}
                                                        </h5>
                                                        {item.productDescription && (
                                                            <p className="text-xs text-slate-500 truncate mt-0.5" title={item.productDescription}>
                                                                {item.productDescription}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-sm text-slate-900 whitespace-nowrap">{formatPrice(item.subtotal)}</p>
                                                </div>
                                                <div className="mt-2 flex items-center text-xs">
                                                    <span className="text-slate-500">{formatPrice(item.discountPrice || item.price)}</span>
                                                    <span className="mx-1.5 text-slate-300">×</span>
                                                    <span className="font-semibold text-slate-700 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-md">{item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fixed Footer Actions */}
                    <DialogFooter className="p-4 border-t border-slate-100 bg-white z-10 gap-3 sm:gap-0">
                        <div className="flex w-full justify-between items-center">
                            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="text-slate-600 hover:bg-slate-50">
                                Đóng
                            </Button>

                            <div className="flex gap-3">
                                {selectedOrder?.status === "PENDING_PAYMENT" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                            onClick={() => {
                                                // Handle cancel logic if needed or use separate function
                                                // cancelOrder logic is likely different (needs reason?)
                                                // For now, let's keep it unused or bind cancelOrder similarly if imported
                                            }}
                                        >
                                            Hủy đơn hàng
                                        </Button>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-200"
                                            onClick={() => handleUpdateStatus(selectedOrder.orderId, "PAID")}
                                        >
                                            Xác nhận đơn hàng
                                        </Button>
                                    </>
                                )}
                                {selectedOrder?.status === "PAID" && (
                                    <>
                                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                            Hoàn tiền
                                        </Button>
                                        <Button
                                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200"
                                            onClick={() => handleUpdateStatus(selectedOrder.orderId, "SHIPPING")}
                                        >
                                            <Truck className="w-4 h-4 mr-2" />
                                            Giao hàng
                                        </Button>
                                    </>
                                )}
                                {selectedOrder?.status === "SHIPPING" && (
                                    <Button
                                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200"
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId, "DELIVERED")}
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Đã giao hàng
                                    </Button>
                                )}
                                {selectedOrder?.status === "DELIVERED" && (
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                                        onClick={() => handleUpdateStatus(selectedOrder.orderId, "COMPLETED")}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Hoàn thành đơn
                                    </Button>
                                )}
                                {(selectedOrder?.status === "CANCELLED" || selectedOrder?.status === "COMPLETED" || selectedOrder?.status === "DELIVERED" || selectedOrder?.status === "PAID") && (
                                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <Printer className="h-4 w-4" />
                                        In hóa đơn
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
