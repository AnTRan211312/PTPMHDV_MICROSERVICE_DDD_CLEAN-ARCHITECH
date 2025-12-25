import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Minus, Plus, Star, ChevronRight,
    AlertTriangle, Heart, Share2,
    Truck, CheckCircle2, Zap, Edit, Trash2, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getProductById } from "@/services/productApi";
import { getInventory } from "@/services/inventoryApi";
import { getReviewsByProduct, createReview, updateReview, deleteReview, getReviewStats, getReviewById } from "@/services/reviewApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { ProductResponse } from "@/types/product";
import type { InventoryResponse } from "@/types/inventory";
import type { ReviewResponse, ReviewStatistics } from "@/types/review";
import { useAppSelector } from "@/features/hooks";
import { formatISO } from "@/utils/convertHelper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import { addToCartThunk } from "@/features/slices/cartSlice";
import { useAppDispatch } from "@/features/hooks";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
    const { id } = useParams();
    const { isLogin, user } = useAppSelector((state) => state.auth);

    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [inventory, setInventory] = useState<InventoryResponse | null>(null);
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [_isAddingToCart, setIsAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");

    // Review form
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

    // Review pagination
    const [reviewPage, setReviewPage] = useState(0);
    const [hasMoreReviews, setHasMoreReviews] = useState(true);
    const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
    const REVIEWS_PER_PAGE = 5;

    // Tính rating distribution từ reviews
    const ratingDistribution = useMemo(() => {
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((review) => {
            if (review.rating >= 1 && review.rating <= 5) {
                distribution[review.rating]++;
            }
        });
        return distribution;
    }, [reviews]);

    useEffect(() => {
        if (!id) return;
        void fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const productId = Number(id);

            const [productRes, inventoryRes, reviewsRes, statsRes] = await Promise.all([
                getProductById(productId),
                getInventory(productId).catch(() => null),
                getReviewsByProduct(productId).catch(() => ({ content: [] })),
                getReviewStats(productId).catch(() => null),
            ]);

            setProduct(productRes.data.data);
            if (productRes.data.data) {
                setSelectedImage(productRes.data.data.thumbnail || "");
            }
            if (inventoryRes) setInventory(inventoryRes.data.data);
            setReviews(reviewsRes.content || []);
            setHasMoreReviews((reviewsRes.content?.length || 0) >= REVIEWS_PER_PAGE);
            setReviewPage(0);
            if (statsRes) setReviewStats(statsRes);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải thông tin sản phẩm"));
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreReviews = async () => {
        if (!product || isLoadingMoreReviews || !hasMoreReviews) return;

        setIsLoadingMoreReviews(true);
        try {
            const nextPage = reviewPage + 1;
            const reviewsRes = await getReviewsByProduct(product.id, nextPage, REVIEWS_PER_PAGE);
            const newReviews = reviewsRes.content || [];

            if (newReviews.length > 0) {
                setReviews(prev => [...prev, ...newReviews]);
                setReviewPage(nextPage);
            }

            setHasMoreReviews(newReviews.length >= REVIEWS_PER_PAGE);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải thêm đánh giá"));
        } finally {
            setIsLoadingMoreReviews(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const getStockStatus = () => {
        if (!inventory) return {
            text: "Liên hệ",
            className: "bg-gray-100 text-gray-800 px-3 py-2 rounded-lg",
            icon: <AlertTriangle className="h-4 w-4" />
        };
        if (inventory.quantity === 0) return {
            text: "Hết hàng",
            className: "bg-red-100 text-red-800 px-3 py-2 rounded-lg",
            icon: <AlertTriangle className="h-4 w-4" />
        };
        if (inventory.quantity <= 10) return {
            text: `Sắp hết hàng - Chỉ còn ${inventory.quantity} sản phẩm!`,
            className: "bg-orange-50 text-orange-600 px-3 py-2 rounded-lg",
            icon: <Zap className="h-4 w-4 fill-orange-600" />
        };
        return {
            text: "Còn hàng tại kho",
            className: "text-green-600",
            icon: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        };
    };

    const dispatch = useAppDispatch();

    const handleAddToCart = async () => {
        if (!product) return;
        if (!isLogin) {
            toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
            return;
        }
        setIsAddingToCart(true);
        try {
            await dispatch(addToCartThunk({ productId: product.id, quantity })).unwrap();
            // Toast is handled in the slice
        } catch (err) {
            // Error toast is handled in the slice
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!product || !isLogin) return;
        setIsSubmittingReview(true);
        try {
            if (editingReviewId) {
                await updateReview(editingReviewId, { rating: newRating, comment: newComment });
                toast.success("Đã cập nhật đánh giá!");
                setEditingReviewId(null);
            } else {
                await createReview(product.id, { rating: newRating, comment: newComment });
                toast.success("Đã gửi đánh giá!");
            }
            // Refresh reviews
            const [reviewsRes, statsRes] = await Promise.all([
                getReviewsByProduct(product.id),
                getReviewStats(product.id).catch(() => null)
            ]);
            setReviews(reviewsRes.content || []);
            if (statsRes) setReviewStats(statsRes);

            // Reset form
            setNewComment("");
            setNewRating(5);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể gửi đánh giá"));
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleEditReview = async (review: ReviewResponse) => {
        setEditingReviewId(review.id);
        setNewRating(review.rating);
        setNewComment(review.comment || "");

        try {
            const latestReview = await getReviewById(review.id);
            setNewRating(latestReview.rating);
            setNewComment(latestReview.comment || "");
        } catch (error) {
            console.error("Failed to fetch latest review details", error);
        }
    };



    const handleDeleteReview = async (reviewId: number) => {
        if (!product) return;
        try {
            await deleteReview(reviewId);
            toast.success("Đã xóa đánh giá!");

            // Refresh reviews
            const [reviewsRes, statsRes] = await Promise.all([
                getReviewsByProduct(product.id),
                getReviewStats(product.id).catch(() => null)
            ]);
            setReviews(reviewsRes.content || []);
            if (statsRes) setReviewStats(statsRes);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể xóa đánh giá"));
        }
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setNewRating(5);
        setNewComment("");
    };

    const isOwnReview = (review: ReviewResponse) => {
        return user?.email === review.userEmail;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Skeleton className="aspect-square rounded-lg" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h2>
                    <Button asChild><Link to="/products">Quay lại danh sách</Link></Button>
                </div>
            </div>
        );
    }

    const isOutOfStock = inventory?.quantity === 0;

    return (
        <div className="min-h-screen bg-white py-4 font-sans text-gray-700">
            {/* Breadcrumbs - Fixed to be Horizontal */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8">
                <nav className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                    <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <Link to="/products" className="hover:text-blue-600 transition-colors">Sản phẩm</Link>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="font-medium text-gray-900 truncate">{product.name}</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
                    {/* Left Column: Images (5 cols) */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="relative group">
                            {/* Main Image */}
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-200 relative">
                                <img
                                    src={selectedImage || product.thumbnail || "/placeholder.png"}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 duration-300"
                                />

                                {/* Wishlist Button - Overlay */}
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 z-10"
                                >
                                    <Heart className="h-4 w-4" />
                                </Button>

                                {/* Zoom Hint */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="absolute inset-0 cursor-zoom-in group-hover:bg-black/2 transition-colors" />
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl w-full h-[80vh] bg-white border-0 p-0 overflow-hidden flex items-center justify-center">
                                        <DialogTitle className="sr-only">{product.name}</DialogTitle>
                                        <div className="w-full h-full p-4 flex items-center justify-center bg-gray-50">
                                            <img
                                                src={selectedImage || product.thumbnail || "/placeholder.png"}
                                                alt={product.name}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
                                <button
                                    type="button"
                                    className={cn(
                                        "w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 transition-all bg-white p-0.5",
                                        selectedImage === product.thumbnail ? "border-[#ee4d2d]" : "border-gray-200 hover:border-[#ee4d2d]"
                                    )}
                                    onClick={() => setSelectedImage(product.thumbnail || "")}
                                >
                                    <img src={product.thumbnail || "/placeholder.png"} className="w-full h-full object-cover rounded-sm" alt="Main" />
                                </button>
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={cn(
                                            "w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 transition-all bg-white p-0.5",
                                            selectedImage === img ? "border-[#ee4d2d]" : "border-gray-200 hover:border-[#ee4d2d]"
                                        )}
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img src={img} className="w-full h-full object-cover rounded-sm" alt={`View ${i}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Info (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                                <button className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <Share2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Rating & Sold */}
                            <div className="flex items-center gap-3 text-sm mt-1">
                                <div className="flex items-center gap-1">
                                    <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "h-4 w-4",
                                                    i < Math.round(reviewStats?.averageRating || product.averageRating || 0)
                                                        ? "fill-[#ee4d2d] text-[#ee4d2d]"
                                                        : "fill-gray-200 text-gray-200"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-gray-500 ml-1 border-b border-dashed border-gray-300">
                                        {reviewStats?.totalReviews || 0} đánh giá
                                    </span>
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <span className="text-gray-500">Đã bán 100+</span>
                            </div>
                        </div>

                        {/* Price Section */}
                        <div className="bg-[#fafafa] p-4 rounded-sm">
                            <div className="flex items-center gap-3">
                                {product.discountPrice ? (
                                    <>
                                        <p className="text-3xl font-bold text-[#ee4d2d]">{formatPrice(product.discountPrice)}</p>
                                        <p className="text-base text-gray-400 line-through">{formatPrice(product.price)}</p>
                                        <Badge className="bg-[#ee4d2d] text-white text-xs h-5 px-1.5">
                                            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                        </Badge>
                                    </>
                                ) : (
                                    <p className="text-3xl font-bold text-[#ee4d2d]">{formatPrice(product.price)}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-3">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Bảo hành 12 tháng</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Truck className="h-4 w-4 text-blue-500" />
                                    <span>Miễn phí vận chuyển</span>
                                </div>
                            </div>
                        </div>

                        {/* Specs Table */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-2">Thông số kỹ thuật</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-100">
                                    <span className="text-gray-500">Mã sản phẩm</span>
                                    <span className="text-gray-800">NF-FUSE-2024</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-100">
                                    <span className="text-gray-500">Kích thước</span>
                                    <span className="text-gray-800">46 x 33 x 15 cm</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-100">
                                    <span className="text-gray-500">Chất liệu</span>
                                    <span className="text-gray-800">1000D TPE Fabric</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-100">
                                    <span className="text-gray-500">Trọng lượng</span>
                                    <span className="text-gray-800">1050g</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-2">Mô tả sản phẩm</h3>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                <p>{product.description || "Đang cập nhật mô tả..."}</p>
                                {!product.description || product.description.length < 100 && (
                                    <p className="mt-1 text-gray-500 italic">
                                        Sản phẩm được thiết kế với phong cách hiện đại, phù hợp cho cả đi làm và đi du lịch.
                                        Chất liệu cao cấp giúp bảo vệ đồ dùng cá nhân an toàn dưới mọi điều kiện thời tiết.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-40 md:static md:bg-transparent md:border-0 md:p-0">
                            <div className="max-w-7xl mx-auto md:max-w-none flex flex-col gap-4">
                                {(() => {
                                    const status = getStockStatus();
                                    return (
                                        <div className={`flex items-center gap-2 text-sm font-medium ${status.className.replace('bg-', 'text-').split(' ')[0]}`}>
                                            {status.icon}
                                            <span>{status.text}</span>
                                        </div>
                                    );
                                })()}

                                <div className="flex gap-4 h-12">
                                    {/* Quantity */}
                                    <div className="flex items-center border border-gray-300 rounded-xl h-full bg-white">
                                        <Button variant="ghost" size="icon" className="h-full rounded-l-xl px-2" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-12 text-center font-semibold">{quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-full rounded-r-xl px-2" onClick={() => setQuantity(q => q + 1)} disabled={!!inventory && quantity >= inventory.quantity}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Buttons */}
                                    <Button
                                        className="flex-1 h-full text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-base rounded-xl"
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock}
                                    >
                                        Thêm vào giỏ
                                    </Button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section - Shopee Style */}
                <div className="bg-white rounded-lg border border-gray-200 mb-20 overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-medium text-gray-800">ĐÁNH GIÁ SẢN PHẨM</h2>
                    </div>

                    {/* Rating Overview - Shopee Style */}
                    <div className="bg-[#fffbf8] border border-[#f9ede5] mx-4 my-4 rounded-sm">
                        <div className="flex flex-col lg:flex-row">
                            {/* Left: Average Score */}
                            <div className="flex-shrink-0 p-6 lg:px-10 lg:py-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#f9ede5]">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[32px] font-medium text-[#ee4d2d]">
                                        {reviewStats?.averageRating?.toFixed(1) || "0.0"}
                                    </span>
                                    <span className="text-lg text-[#ee4d2d]">trên 5</span>
                                </div>
                                <div className="flex items-center gap-0.5 mt-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "h-5 w-5",
                                                i < Math.round(reviewStats?.averageRating || 0)
                                                    ? "fill-[#ee4d2d] text-[#ee4d2d]"
                                                    : "fill-gray-300 text-gray-300"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right: Rating Breakdown + Filter Buttons */}
                            <div className="flex-1 p-6">
                                {/* Rating Breakdown Bars */}
                                <div className="space-y-2 mb-5">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = ratingDistribution[star] || 0;
                                        const total = reviews.length;
                                        const percentage = total > 0 ? (count / total) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 w-14 flex-shrink-0">
                                                    <span className="text-sm text-gray-600">{star}</span>
                                                    <Star className="h-3.5 w-3.5 fill-[#ee4d2d] text-[#ee4d2d]" />
                                                </div>
                                                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#ee4d2d] rounded-full transition-all duration-300"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-12 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Filter Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-sm border-[#ee4d2d] bg-[#fff5f5] text-[#ee4d2d] hover:bg-[#ffeaea] h-8 px-4 text-sm font-normal"
                                    >
                                        Tất Cả
                                    </Button>
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <Button
                                            key={star}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-sm border-gray-300 text-gray-700 hover:border-[#ee4d2d] hover:text-[#ee4d2d] hover:bg-[#fff5f5] h-8 px-4 text-sm font-normal"
                                        >
                                            {star} Sao ({ratingDistribution[star] || 0})
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-sm border-gray-300 text-gray-700 hover:border-[#ee4d2d] hover:text-[#ee4d2d] hover:bg-[#fff5f5] h-8 px-4 text-sm font-normal"
                                    >
                                        Có Bình Luận ({reviews.filter(r => r.comment).length})
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Write Review Form - Shopee Style */}
                    {isLogin && (
                        <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-sm border border-gray-100">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 border border-gray-200">
                                    <AvatarImage src={user?.logoUrl || undefined} />
                                    <AvatarFallback className="bg-[#ee4d2d] text-white font-medium text-sm">
                                        {user?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-gray-700">
                                            {editingReviewId ? "Chỉnh sửa đánh giá" : "Viết đánh giá của bạn"}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">Chất lượng sản phẩm:</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-7 w-7 cursor-pointer transition-transform hover:scale-110",
                                                            i < newRating
                                                                ? "fill-[#ee4d2d] text-[#ee4d2d]"
                                                                : "fill-gray-300 text-gray-300 hover:fill-[#ee4d2d]/50 hover:text-[#ee4d2d]/50"
                                                        )}
                                                        onClick={() => setNewRating(i + 1)}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm text-[#ee4d2d] min-w-[70px]">
                                                {newRating === 5 && "Tuyệt vời"}
                                                {newRating === 4 && "Hài lòng"}
                                                {newRating === 3 && "Bình thường"}
                                                {newRating === 2 && "Không hài lòng"}
                                                {newRating === 1 && "Tệ"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmitReview();
                                                }
                                            }}
                                            placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé!"
                                            className="min-h-[80px] resize-none border-gray-300 focus:border-[#ee4d2d] focus:ring-[#ee4d2d] rounded-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 mt-3">
                                        {editingReviewId && (
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                                className="rounded-sm border-gray-300 px-6"
                                            >
                                                Hủy
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSubmitReview}
                                            disabled={isSubmittingReview}
                                            className="bg-[#ee4d2d] hover:bg-[#d73211] rounded-sm px-8 min-w-[120px]"
                                        >
                                            {isSubmittingReview ? (
                                                <span className="animate-pulse">Đang gửi...</span>
                                            ) : editingReviewId ? (
                                                "Cập nhật"
                                            ) : (
                                                "Gửi đánh giá"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews List - Shopee Style */}
                    <div className="divide-y divide-gray-100">
                        {reviews.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Star className="h-12 w-12 text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-lg">Chưa có đánh giá nào</p>
                                {isLogin && (
                                    <p className="text-gray-400 text-sm mt-2">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                                )}
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors group">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <Avatar className="h-10 w-10 flex-shrink-0 border border-gray-200">
                                            <AvatarImage src={review.avatar || undefined} />
                                            <AvatarFallback className="bg-[#ee4d2d] text-white font-medium text-sm">
                                                {review.userName?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* User name */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-800">{review.userName || "Người dùng ẩn danh"}</span>
                                                {/* Action Menu */}
                                                {isOwnReview(review) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-36">
                                                            <DropdownMenuItem onClick={() => handleEditReview(review)} className="cursor-pointer">
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Chỉnh sửa
                                                            </DropdownMenuItem>
                                                            <DeleteConfirmDialog onConfirm={() => handleDeleteReview(review.id)}>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 cursor-pointer">
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Xóa
                                                                </DropdownMenuItem>
                                                            </DeleteConfirmDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-0.5 mt-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-3 w-3",
                                                            i < review.rating
                                                                ? "fill-[#ee4d2d] text-[#ee4d2d]"
                                                                : "fill-gray-300 text-gray-300"
                                                        )}
                                                    />
                                                ))}
                                            </div>

                                            {/* Timestamp & Variant info */}
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                <span>{formatISO(review.createdAt)}</span>
                                                <span className="text-gray-300">|</span>
                                                <span>Phân loại hàng: {product?.name || "Sản phẩm"}</span>
                                            </div>

                                            {/* Comment */}
                                            <p className="text-gray-700 mt-3 leading-relaxed text-sm">
                                                {review.comment || <span className="text-gray-400 italic">Người mua không để lại nhận xét.</span>}
                                            </p>

                                            {/* Like/Dislike buttons - Shopee style */}
                                            <div className="flex items-center gap-4 mt-4">
                                                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#ee4d2d] transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                    </svg>
                                                    <span>Hữu ích</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Load More */}
                    {reviews.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Hiển thị {reviews.length} trên {reviewStats?.totalReviews || reviews.length} đánh giá
                            </span>
                            {hasMoreReviews && reviews.length < (reviewStats?.totalReviews || 0) && (
                                <Button
                                    variant="outline"
                                    className="text-[#ee4d2d] border-[#ee4d2d] hover:bg-[#fff5f5] rounded-sm px-8"
                                    onClick={loadMoreReviews}
                                    disabled={isLoadingMoreReviews}
                                >
                                    {isLoadingMoreReviews ? (
                                        <span className="animate-pulse">Đang tải...</span>
                                    ) : (
                                        "Xem thêm"
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
