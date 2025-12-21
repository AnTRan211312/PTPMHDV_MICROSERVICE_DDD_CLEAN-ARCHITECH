
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getQuantitiesByProductIds } from "@/services/inventoryApi";
import { checkoutSelected, checkout } from "@/services/orderApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import { useAppSelector, useAppDispatch } from "@/features/hooks";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import type { InventoryQuantityResponse } from "@/types/inventory";
import {
    fetchCart,
    updateCartItemThunk,
    removeCartItemThunk,
    clearCartThunk
} from "@/features/slices/cartSlice";

const CartPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLogin } = useAppSelector((state) => state.auth);
    const { cart, isLoading } = useAppSelector((state) => state.cart);

    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [updatingItem, setUpdatingItem] = useState<number | null>(null);
    const [stockMap, setStockMap] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchStock = async () => {
            if (cart?.items && cart.items.length > 0) {
                const productIds = cart.items.map((i) => i.productId);
                try {
                    const stockRes = (await getQuantitiesByProductIds(productIds)).data.data;
                    const stockData = Array.isArray(stockRes)
                        ? stockRes.reduce((acc: Record<number, number>, item: InventoryQuantityResponse) => ({ ...acc, [item.productId]: item.quantity }), {})
                        : stockRes;
                    setStockMap(stockData || {});
                } catch (error: unknown) {
                    console.error("Failed to fetch stock data", error);
                }
            }
        };

        if (cart) {
            fetchStock();
        }
    }, [cart]);

    useEffect(() => {
        if (cart?.items?.length && selectedItems.length === 0) {
            setSelectedItems(cart.items.map(i => i.productId));
        }
    }, [cart?.items?.length]);

    useEffect(() => {
        if (!isLogin) {
            navigate("/auth?mode=login");
            return;
        }
        dispatch(fetchCart());
    }, [isLogin, navigate, dispatch]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        const currentStock = stockMap[productId];
        if (currentStock !== undefined && newQuantity > currentStock) {
            toast.error(`Chỉ còn ${currentStock} sản phẩm trong kho`);
            return;
        }

        setUpdatingItem(productId);
        try {
            await dispatch(updateCartItemThunk({ productId, quantity: newQuantity })).unwrap();
        } catch (err: unknown) {
            // Error handled
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleRemoveItem = async (productId: number) => {
        try {
            const item = cart?.items?.find((i) => i.productId === productId);
            if (!item) return;
            await dispatch(removeCartItemThunk({ productId, quantity: item.quantity })).unwrap();
            setSelectedItems((prev) => prev.filter((id) => id !== productId));
        } catch (err: unknown) {
            // Error handled
        }
    };

    const handleClearCart = async () => {
        try {
            await dispatch(clearCartThunk()).unwrap();
            setSelectedItems([]);
        } catch (err: unknown) {
            // Error handled
        }
    };

    const toggleSelectItem = (productId: number) => {
        setSelectedItems((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === cart?.items?.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart?.items?.map((i) => i.productId) || []);
        }
    };

    const selectedTotal = cart?.items
        ?.filter((item) => selectedItems.includes(item.productId))
        ?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

    const totalItemQuantity = cart?.items
        ?.filter((item) => selectedItems.includes(item.productId))
        ?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const handleCheckout = async () => {
        if (selectedItems.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm");
            return;
        }
        try {
            let res;
            if (cart && selectedItems.length === cart.items?.length) {
                res = (await checkout()).data.data;
            } else {
                res = (await checkoutSelected({ productIds: selectedItems })).data.data;
            }

            toast.success("Đặt hàng thành công!");
            dispatch(fetchCart());
            navigate(`/user/orders/${res.orderId}`);
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể đặt hàng"));
        }
    };

    if (isLoading && !cart) {
        return (
            <div className="container mx-auto max-w-6xl px-4 py-6">
                <Skeleton className="mb-6 h-8 w-48" />
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-lg" />
                        ))}
                    </div>
                    <div className="lg:col-span-4">
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="container mx-auto max-w-4xl p-6">
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-gray-900">Giỏ hàng trống</h2>
                    <p className="mb-6 text-gray-500 text-center max-w-sm">
                        Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
                    </p>
                    <Button asChild className="bg-[#ee4d2d] hover:bg-[#d73211] rounded-lg px-8">
                        <Link to="/products">Mua sắm ngay</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">
                    Giỏ hàng
                    <span className="text-gray-500 font-normal ml-2 text-base">({cart.totalItems} sản phẩm)</span>
                </h1>
                <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900 h-9">
                    <Link to="/products" className="gap-2 text-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Tiếp tục mua sắm
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                {/* Cart Items - Left Column */}
                <div className="lg:col-span-8 space-y-3">
                    {/* Table Header - Desktop */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-100">
                        <div className="col-span-6 flex items-center gap-3">
                            <Checkbox
                                checked={(cart.items?.length ?? 0) > 0 && selectedItems.length === cart.items?.length}
                                onCheckedChange={toggleSelectAll}
                            />
                            <span>Sản phẩm</span>
                        </div>
                        <div className="col-span-2 text-center">Đơn giá</div>
                        <div className="col-span-2 text-center">Số lượng</div>
                        <div className="col-span-2 text-right pr-2">Thành tiền</div>
                    </div>

                    {/* Mobile Header */}
                    <div className="md:hidden flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={(cart.items?.length ?? 0) > 0 && selectedItems.length === cart.items?.length}
                                onCheckedChange={toggleSelectAll}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Chọn tất cả ({cart.items?.length || 0})
                            </span>
                        </div>
                        <DeleteConfirmDialog onConfirm={handleClearCart}>
                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </DeleteConfirmDialog>
                    </div>

                    {/* Cart Items */}
                    {cart.items?.map((item) => {
                        const unitPrice = item.discountPrice || item.originalPrice;
                        const subtotal = unitPrice * item.quantity;
                        const isMinQuantity = item.quantity <= 1;
                        const isMaxQuantity = stockMap[item.productId] !== undefined && item.quantity >= stockMap[item.productId];

                        return (
                            <Card key={item.productId} className="border border-gray-100 shadow-sm hover:shadow transition-shadow bg-white">
                                <CardContent className="p-4">
                                    {/* Desktop Layout - Table-like with proper alignment */}
                                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                                        {/* Product Info - 6 cols */}
                                        <div className="col-span-6 flex items-center gap-4">
                                            <Checkbox
                                                checked={selectedItems.includes(item.productId)}
                                                onCheckedChange={() => toggleSelectItem(item.productId)}
                                                className="flex-shrink-0"
                                            />
                                            <div
                                                className="h-[72px] w-[72px] rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => navigate(`/products/${item.productId}`)}
                                            >
                                                {item.productImage ? (
                                                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <h3
                                                    className="font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-[#ee4d2d] transition-colors text-sm leading-snug"
                                                    onClick={() => navigate(`/products/${item.productId}`)}
                                                >
                                                    {item.productName}
                                                </h3>
                                                {stockMap[item.productId] !== undefined && stockMap[item.productId] < item.quantity && (
                                                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                                        <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                                        Chỉ còn {stockMap[item.productId]} sản phẩm
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unit Price - 2 cols */}
                                        <div className="col-span-2 text-center">
                                            {item.discountPrice ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-[#ee4d2d] font-medium text-sm">
                                                        {formatPrice(item.discountPrice)}
                                                    </p>
                                                    <p className="line-through text-xs text-gray-500">
                                                        {formatPrice(item.originalPrice)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-[#ee4d2d] font-medium text-sm">
                                                    {formatPrice(item.originalPrice)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Quantity - 2 cols */}
                                        <div className="col-span-2 flex justify-center">
                                            <div className="inline-flex items-center border border-gray-200 rounded h-8 bg-white">
                                                <button
                                                    className={`h-full w-8 flex items-center justify-center border-r border-gray-200 transition-colors rounded-l ${isMinQuantity
                                                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                    disabled={updatingItem === item.productId || isMinQuantity}
                                                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-10 text-center text-sm font-medium text-gray-900">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    className={`h-full w-8 flex items-center justify-center border-l border-gray-200 transition-colors rounded-r ${isMaxQuantity
                                                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                    disabled={updatingItem === item.productId || isMaxQuantity}
                                                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtotal + Delete - 2 cols */}
                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                            <span className="text-[#ee4d2d] font-semibold text-sm min-w-[90px] text-right">
                                                {formatPrice(subtotal)}
                                            </span>
                                            <DeleteConfirmDialog onConfirm={() => handleRemoveItem(item.productId)}>
                                                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </DeleteConfirmDialog>
                                        </div>
                                    </div>

                                    {/* Mobile Layout */}
                                    <div className="md:hidden flex gap-3">
                                        <Checkbox
                                            checked={selectedItems.includes(item.productId)}
                                            onCheckedChange={() => toggleSelectItem(item.productId)}
                                            className="mt-1 flex-shrink-0"
                                        />
                                        <div
                                            className="h-20 w-20 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100"
                                            onClick={() => navigate(`/products/${item.productId}`)}
                                        >
                                            {item.productImage ? (
                                                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingBag className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-snug flex-1">
                                                    {item.productName}
                                                </h3>
                                                <DeleteConfirmDialog onConfirm={() => handleRemoveItem(item.productId)}>
                                                    <button className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </DeleteConfirmDialog>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div>
                                                    {item.discountPrice ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#ee4d2d] font-medium text-sm">{formatPrice(item.discountPrice)}</span>
                                                            <span className="line-through text-xs text-gray-500">{formatPrice(item.originalPrice)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[#ee4d2d] font-medium text-sm">{formatPrice(item.originalPrice)}</span>
                                                    )}
                                                </div>
                                                <div className="inline-flex items-center border border-gray-200 rounded h-7 bg-white">
                                                    <button
                                                        className={`h-full w-7 flex items-center justify-center ${isMinQuantity ? 'text-gray-300' : 'text-gray-600'}`}
                                                        disabled={isMinQuantity}
                                                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm border-x border-gray-200">{item.quantity}</span>
                                                    <button
                                                        className={`h-full w-7 flex items-center justify-center ${isMaxQuantity ? 'text-gray-300' : 'text-gray-600'}`}
                                                        disabled={isMaxQuantity}
                                                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[#ee4d2d] font-semibold text-sm mt-2">
                                                = {formatPrice(subtotal)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }) || []}

                    {/* Desktop Clear All */}
                    <div className="hidden md:flex justify-end pt-1">
                        <DeleteConfirmDialog onConfirm={handleClearCart}>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 hover:bg-red-50 h-8">
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Xóa tất cả
                            </Button>
                        </DeleteConfirmDialog>
                    </div>
                </div>

                {/* Order Summary - Right Column */}
                <div className="lg:col-span-4">
                    <Card className="sticky top-24 border border-gray-100 shadow-sm bg-white">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-base font-semibold text-gray-900">Tóm tắt đơn hàng</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Số loại sản phẩm</span>
                                <span className="text-gray-900 font-medium">{selectedItems.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tổng số lượng</span>
                                <span className="text-gray-900 font-medium">{totalItemQuantity} món</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phí vận chuyển</span>
                                <span className="text-green-600 font-medium">Miễn phí</span>
                            </div>

                            <div className="border-t border-gray-100 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">Tổng thanh toán</span>
                                    <span className="text-xl font-bold text-[#ee4d2d]">{formatPrice(selectedTotal)}</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">(Đã bao gồm VAT nếu có)</p>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-[#ff6633] to-[#ee4d2d] hover:from-[#ee5522] hover:to-[#dd3c1c] text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg transition-all mt-3"
                                disabled={selectedItems.length === 0}
                                onClick={handleCheckout}
                            >
                                Đặt hàng ({totalItemQuantity})
                            </Button>

                            <div className="flex items-center justify-center gap-5 pt-4 text-xs border-t border-gray-100 mt-4">
                                <span className="flex items-center gap-1.5 text-green-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Bảo mật thanh toán
                                </span>
                                <span className="flex items-center gap-1.5 text-blue-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Đổi trả 7 ngày
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
