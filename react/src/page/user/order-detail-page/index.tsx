import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Package, CreditCard, Copy, FileText, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getOrder, cancelOrder } from "@/services/orderApi";
import { createPayment } from "@/services/paymentApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { OrderResponse } from "@/types/order";
import { formatISO } from "@/utils/convertHelper";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";

const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    SHIPPING: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-teal-100 text-teal-800",
};

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
};



const OrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchOrder = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const res = (await getOrder(Number(id))).data.data;
            setOrder(res);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải đơn hàng"));
            navigate("/user/orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchOrder();
    }, [id]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const handlePayment = async () => {
        if (!order) return;
        setIsProcessing(true);
        try {
            const res = (await createPayment(order.orderId, { paymentMethod: "VNPAY" })).data.data;
            window.location.href = res.paymentUrl;
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tạo thanh toán"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!order) return;
        try {
            await cancelOrder(order.orderId);
            toast.success("Đã hủy đơn hàng");
            void fetchOrder();
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể hủy đơn hàng"));
        }
    };

    const handleCopyOrderCode = () => {
        if (order?.orderCode) {
            void navigator.clipboard.writeText(order.orderCode);
            toast.success("Đã sao chép mã đơn hàng");
        }
    };

    // Helper to determine step status
    const getStepStatus = (stepIndex: number, currentStatus: string) => {
        const flow = ["PENDING_PAYMENT", "PAID", "SHIPPING", "DELIVERED", "COMPLETED"];
        const currentIndex = flow.indexOf(currentStatus);

        if (currentStatus === "CANCELLED") return "cancelled";
        if (currentIndex === -1) return "inactive";
        if (currentIndex >= stepIndex) return "active";
        return "inactive";
    };

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-6xl p-4 sm:p-6">
                <div className="mb-8 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 min-h-[calc(100vh-140px)]">
            {/* Header with Stepper */}
            <div className="mb-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-9 w-9 border-gray-200 bg-white hover:bg-gray-50" asChild>
                            <Link to="/user/orders">
                                <ArrowLeft className="h-4 w-4 text-gray-600" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyOrderCode}>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">{order.orderCode}</h1>
                                <Copy className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Đặt ngày {formatISO(order.createdAt)}</p>
                        </div>
                    </div>
                    <Badge className={`${statusColors[order.status]} border-0 px-3 py-1 text-sm font-medium rounded-full shadow-sm`}>
                        {statusLabels[order.status] || order.status}
                    </Badge>
                </div>

                {/* Order Progress Stepper (Hidden for Cancelled) */}
                {order.status !== "CANCELLED" && (
                    <div className="hidden sm:flex items-center justify-between relative px-4 sm:px-12 py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 -z-0" />

                        {[
                            { label: "Đơn hàng đã đặt", icon: FileText, index: 0 },
                            { label: "Thanh toán", icon: CreditCard, index: 1 },
                            { label: "Đang giao hàng", icon: Truck, index: 2 },
                            { label: "Đã nhận hàng", icon: Package, index: 3 },
                        ].map((step, i) => {
                            const status = getStepStatus(step.index, order.status);
                            const isActive = status === "active";
                            return (
                                <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-200 text-gray-300"}`}>
                                        {isActive ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? "text-gray-900" : "text-gray-400"}`}>{step.label}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Product List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
                        <CardHeader className="bg-gray-50/50 py-4 px-6 border-b border-gray-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-medium text-gray-700">Kiện hàng ({order.totalItems} sản phẩm)</CardTitle>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Được giao bởi Buyio Express</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-5 hover:bg-gray-50/30 transition-colors group">
                                        <div className="h-20 w-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                            {item.productImage ? (
                                                <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                    <Package className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between gap-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 pr-2">{item.productName}</h3>
                                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.productDescription}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {item.discountPrice ? (
                                                        <div className="flex flex-col items-end leading-none">
                                                            <span className="text-sm font-medium text-gray-900">{formatPrice(item.discountPrice)}</span>
                                                            <span className="text-xs text-gray-400 line-through mt-1">{formatPrice(item.price)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-900">{formatPrice(item.price)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-flex items-center">
                                                    Số lượng: <span className="font-semibold text-gray-900 ml-1">{item.quantity}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{formatPrice(item.subtotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Order Summary & Actions (Sticky) */}
                <div className="lg:col-span-1 space-y-4 sticky top-6">
                    {/* Status & Payment Action */}
                    {order.status === "PENDING_PAYMENT" && (
                        <Card className="border-orange-200 bg-orange-50/30 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Clock className="w-24 h-24 text-orange-600" />
                            </div>
                            <CardContent className="p-5 space-y-4 relative z-10">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900">Thanh toán đang chờ</h4>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">Đơn hàng sẽ được giữ trong 24h. Vui lòng thanh toán sớm.</p>
                                </div>
                                <div className="space-y-2.5">
                                    <Button onClick={handlePayment} disabled={isProcessing} className="w-full bg-orange-600 hover:bg-orange-700 h-10 shadow-sm font-medium">
                                        Thanh toán ngay
                                    </Button>
                                    <DeleteConfirmDialog onConfirm={handleCancel}>
                                        <Button variant="outline" className="w-full h-10 border-orange-200 hover:bg-orange-50 hover:text-orange-700 bg-white/50 backdrop-blur-sm">Hủy đơn hàng</Button>
                                    </DeleteConfirmDialog>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Information Card */}
                    <Card className="shadow-sm border-gray-200 bg-white">
                        <CardHeader className="bg-gray-50/50 py-3.5 px-5 border-b border-gray-100">
                            <CardTitle className="text-sm font-medium text-gray-700">Chi tiết thanh toán</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tạm tính</span>
                                    <span className="font-medium text-gray-900">{formatPrice(order.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Phí vận chuyển</span>
                                    <span className="font-medium text-green-600">Miễn phí</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Giảm giá voucher</span>
                                    <span className="font-medium text-gray-900">-0 đ</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200 my-3 pt-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-gray-900">Tổng thanh toán</span>
                                        <span className="text-xl font-bold text-orange-600">{formatPrice(order.totalAmount)}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 text-right font-normal">Đã bao gồm VAT</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Support Card - Optional */}
                    <Card className="shadow-sm border-gray-200 bg-gray-50/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Phương thức thanh toán</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Thanh toán bảo mật qua VNPAY</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
