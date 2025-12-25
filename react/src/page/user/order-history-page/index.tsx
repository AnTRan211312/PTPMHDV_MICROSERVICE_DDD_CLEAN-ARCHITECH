
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Truck, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getOrderHistory, getOrdersByStatus } from "@/services/orderApi";
import { formatPrice } from "@/utils/convertHelper";
import { formatISO } from "@/utils/convertHelper";
import type { OrderResponse } from "@/types/order";
import Pagination from "@/components/rickTexts/Pagination";
import UserSidebar from "@/components/user/UserSidebar";

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
};

const OrderHistoryPage = () => {
    // Redux User Data (Removed as handled by UserSidebar)


    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [activeStatus, setActiveStatus] = useState<string | null>(null);

    const orderTabs = [
        { label: "Tất cả", status: null },
        { label: "Chờ thanh toán", status: "PENDING_PAYMENT" },
        { label: "Đã thanh toán", status: "PAID" },
        { label: "Đang giao", status: "SHIPPING" },
        { label: "Đã giao", status: "DELIVERED" },
        { label: "Hoàn thành", status: "COMPLETED" },
        { label: "Đã hủy", status: "CANCELLED" },
    ];

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            let res;
            if (activeStatus) {
                res = (await getOrdersByStatus(activeStatus, currentPage - 1, itemsPerPage)).data.data;
            } else {
                res = (await getOrderHistory(currentPage - 1, itemsPerPage)).data.data;
            }
            setOrders(res.content);
            setTotalPages(res.totalPages);
            setTotalElements(res.totalElements);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải lịch sử đơn hàng");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchOrders();
    }, [currentPage, itemsPerPage, activeStatus]);

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-[800px] px-4 py-8">
                <Skeleton className="mb-4 h-8 w-48" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }



    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            <div className="container mx-auto max-w-6xl px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Shopee-style Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-6">
                            <UserSidebar />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Tab-like Header */}
                        <div className="bg-white rounded-t-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
                            <div className="flex overflow-x-auto no-scrollbar bg-white">
                                {orderTabs.map((tab, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setActiveStatus(tab.status);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap hover:text-orange-600 flex-shrink-0 ${activeStatus === tab.status
                                            ? "text-orange-600 border-orange-600"
                                            : "text-gray-600 border-transparent hover:border-gray-200"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[500px]">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <Skeleton key={i} className="h-48 w-full bg-white rounded-sm" />
                                    ))}
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-sm shadow-sm">
                                    <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h2 className="text-gray-900 font-medium mb-1">Chưa có đơn hàng</h2>
                                    <Button asChild className="mt-4 bg-orange-600 hover:bg-orange-700">
                                        <Link to="/products">Mua sắm ngay</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map((order) => (
                                        <div key={order.orderId} className="bg-white rounded-sm shadow-sm border border-gray-100">
                                            {/* Card Header */}
                                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-orange-600 text-white text-[10px] px-1 py-0.5 rounded-sm font-semibold">Buyio Mall</span>
                                                    <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
                                                    <span className="text-xs text-gray-500 font-mono">{order.orderCode}</span>
                                                    <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatISO(order.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {["SHIPPING", "DELIVERED", "COMPLETED"].includes(order.status) && (
                                                        <>
                                                            <div className="flex items-center gap-1 text-teal-600 text-xs font-medium uppercase truncate">
                                                                <Truck className="h-3.5 w-3.5" />
                                                                <span>{order.status === 'SHIPPING' ? 'Đơn hàng đang được giao' : 'Giao hàng thành công'}</span>
                                                            </div>
                                                            <span className="h-4 w-[1px] bg-gray-300"></span>
                                                        </>
                                                    )}
                                                    <span className={`uppercase text-sm font-semibold tracking-wide ${order.status === 'CANCELLED' ? 'text-red-600' : 'text-orange-600'} `}>
                                                        {statusLabels[order.status] || order.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Product List */}
                                            <div className="divide-y divide-gray-50">
                                                {order.items?.map((item, idx) => (
                                                    <Link to={`/user/orders/${order.orderId}`} key={idx} className="block hover:bg-gray-50/50 transition-colors">
                                                        <div className="p-4 flex gap-4 items-start">
                                                            <div className="h-20 w-20 border border-gray-200 flex-shrink-0 bg-gray-50">
                                                                {item.productImage ? (
                                                                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                                        <Package className="h-6 w-6" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.productName}</h3>
                                                                <p className="text-xs text-gray-500 mb-1">Phân loại hàng: {item.productDescription || "Mặc định"}</p>
                                                                <p className="text-xs text-gray-900">x{item.quantity}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                {item.discountPrice ? (
                                                                    <div className="flex items-center gap-2 justify-end">
                                                                        <span className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</span>
                                                                        <span className="text-sm font-medium text-orange-600">{formatPrice(item.discountPrice)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm font-medium text-gray-900">{formatPrice(item.price)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>

                                            {/* Card Footer */}
                                            <div className="px-6 py-4 bg-[#fffefb] border-t border-gray-100">
                                                <div className="flex flex-col items-end gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-800">Thành tiền:</span>
                                                        <span className="text-xl font-bold text-orange-600">{formatPrice(order.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {order.status === "COMPLETED" && <span className="text-xs text-gray-500">Đánh giá ngay để nhận 200 xu</span>}
                                                        <div className="flex gap-2">
                                                            {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
                                                                <Button className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px]">
                                                                    Mua lại
                                                                </Button>
                                                            )}
                                                            <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 min-w-[140px]" asChild>
                                                                <Link to={`/user/orders/${order.orderId}`}>
                                                                    Xem chi tiết
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {orders.length > 0 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    totalPages={totalPages}
                                    totalElements={totalElements}
                                    itemsPerPage={itemsPerPage}
                                    setItemsPerPage={setItemsPerPage}
                                    showItemsPerPageSelect={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderHistoryPage;
