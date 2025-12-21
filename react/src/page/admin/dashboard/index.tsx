import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Star, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { getAllDashboardStats } from "@/services/dashboardApi";
import type { DashboardStats, TopProduct, DailyRevenue } from "@/types/dashboard.d.ts";
import type { OrderStatsResponse } from "@/types/order.d.ts";
import { toast } from "sonner";

// Format currency
const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M đ`;
    } else if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}K đ`;
    }
    return `${value.toLocaleString()} đ`;
};

// Order status colors for pie chart
const ORDER_STATUS_COLORS = {
    completed: "#10b981", // Green
    delivered: "#3b82f6", // Blue
    shipping: "#8b5cf6", // Purple
    paid: "#22c55e", // Lighter green
    pendingPayment: "#f59e0b", // Yellow
    cancelled: "#ef4444", // Red
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
            setError("Không thể tải dữ liệu Dashboard. Vui lòng thử lại.");
            toast.error("Không thể tải dữ liệu Dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Auto refresh every 60 seconds
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Transform order stats to pie chart data
    const getOrderStatusData = (orders: OrderStatsResponse) => [
        { name: "Hoàn thành", value: orders.completed, color: ORDER_STATUS_COLORS.completed },
        { name: "Đã giao", value: orders.delivered, color: ORDER_STATUS_COLORS.delivered },
        { name: "Đang giao", value: orders.shipping, color: ORDER_STATUS_COLORS.shipping },
        { name: "Đã thanh toán", value: orders.paid, color: ORDER_STATUS_COLORS.paid },
        { name: "Chờ thanh toán", value: orders.pendingPayment, color: ORDER_STATUS_COLORS.pendingPayment },
        { name: "Đã hủy", value: orders.cancelled, color: ORDER_STATUS_COLORS.cancelled },
    ].filter(item => item.value > 0);

    // Transform daily revenue to chart data
    const getRevenueChartData = (dailyRevenue: DailyRevenue[]) => {
        return dailyRevenue.map(item => ({
            name: item.label,
            revenue: item.revenue / 1_000_000, // Convert to millions
            orders: item.orderCount,
        }));
    };

    // Transform top products to chart data
    const getTopProductsData = (topProducts: TopProduct[]) => {
        return topProducts.map(product => ({
            name: product.productName.length > 20
                ? product.productName.substring(0, 20) + "..."
                : product.productName,
            fullName: product.productName,
            sales: product.salesCount,
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <p className="text-muted-foreground">Đang tải dữ liệu Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <p className="text-red-500 text-lg">{error || "Có lỗi xảy ra"}</p>
                    <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    const { products, users, orders, payments, reviews } = stats;
    const revenueData = getRevenueChartData(payments.dailyRevenue);
    const orderStatusData = getOrderStatusData(orders);
    const topProductsData = getTopProductsData(products.topProducts);


    return (
        <div className="space-y-6">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Tổng quan</h1>
                <Button onClick={fetchDashboardData} variant="outline" size="sm" className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Làm mới
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.totalProducts.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {products.topProducts.length > 0
                                ? `Top: ${products.topProducts[0]?.productName?.substring(0, 20) || "N/A"}`
                                : "Chưa có sản phẩm"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {orders.completed} hoàn thành | {orders.shipping} đang giao
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Tổng số tài khoản đã đăng ký</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(payments.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Tổng doanh thu từ thanh toán thành công</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reviews.totalReviews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            ⭐ {reviews.averageRating.toFixed(1)} điểm trung bình
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1: Revenue & Top Products */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue Chart */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Doanh thu 7 ngày qua
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis
                                        stroke="#6b7280"
                                        tickFormatter={(value) => `${value}M`}
                                        label={{ value: 'Triệu VNĐ', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 12 } }}
                                    />
                                    <Tooltip
                                        formatter={(value, _name, props) => {
                                            const dataKey = props.dataKey;
                                            if (dataKey === "revenue") {
                                                return [`${Number(value).toFixed(1)}M đ`, "Doanh thu"];
                                            }
                                            return [value, "Đơn hàng"];
                                        }}
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="Doanh thu (triệu)"
                                        dot={{ fill: "#3b82f6", r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="orders"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Đơn hàng"
                                        dot={{ fill: "#10b981", r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                Chưa có dữ liệu doanh thu
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products Chart */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-500" />
                            Top 5 sản phẩm bán chạy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topProductsData} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#6b7280"
                                        fontSize={11}
                                        angle={-35}
                                        textAnchor="end"
                                        height={80}
                                        interval={0}
                                    />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value, _name, props) => [
                                            value,
                                            `Số lượng bán: ${props.payload.fullName}`
                                        ]}
                                    />
                                    <Bar dataKey="sales" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Số lượng bán" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                Chưa có dữ liệu sản phẩm bán chạy
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Order Status & Recent Reviews */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Order Status Pie Chart */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-green-500" />
                            Phân bố trạng thái đơn hàng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orderStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                Chưa có đơn hàng
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Tổng quan Đơn hàng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                                <span className="font-medium text-green-700">Hoàn thành</span>
                                <span className="text-xl font-bold text-green-700">{orders.completed}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <span className="font-medium text-blue-700">Đã giao</span>
                                <span className="text-xl font-bold text-blue-700">{orders.delivered}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                                <span className="font-medium text-purple-700">Đang giao</span>
                                <span className="text-xl font-bold text-purple-700">{orders.shipping}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                <span className="font-medium text-yellow-700">Chờ thanh toán</span>
                                <span className="text-xl font-bold text-yellow-700">{orders.pendingPayment}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-200">
                                <span className="font-medium text-red-700">Đã hủy</span>
                                <span className="text-xl font-bold text-red-700">{orders.cancelled}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
