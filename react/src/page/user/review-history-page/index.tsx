import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Pagination from "@/components/rickTexts/Pagination";
import { Star, MessageSquare, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyReviews, type MyReviewResponse } from "@/services/reviewApi";
import { toast } from "sonner";
import UserSidebar from "@/components/user/UserSidebar";

export default function ReviewHistoryPage() {
    const [reviews, setReviews] = useState<MyReviewResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchReviews();
    }, [currentPage, itemsPerPage]);

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const data = await getMyReviews(currentPage - 1, itemsPerPage);
            setReviews(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
            toast.error("Không thể tải lịch sử đánh giá");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            <div className="container mx-auto max-w-6xl px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-6">
                            <UserSidebar />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 min-h-[500px]">
                            {/* Header */}
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h1 className="text-lg font-medium text-gray-900">Lịch sử đánh giá</h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Quản lý và xem lại các đánh giá bạn đã viết ({totalElements} đánh giá)
                                </p>
                            </div>

                            {/* Reviews List */}
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-sm">
                                            <Skeleton className="w-20 h-20 rounded-sm" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-1/3" />
                                                <Skeleton className="h-4 w-1/4" />
                                                <Skeleton className="h-12 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="font-medium text-gray-900 mb-1">Chưa có đánh giá nào</h3>
                                    <p className="text-gray-500 text-sm mb-4">Bạn chưa viết đánh giá cho sản phẩm nào</p>
                                    <Link to="/products">
                                        <Button className="bg-orange-600 hover:bg-orange-700">Viết đánh giá ngay</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="group relative bg-white border-b border-gray-100 last:border-0 p-6 hover:bg-gray-50/30 transition-colors duration-200">
                                            <div className="flex gap-4">
                                                {/* Product Image */}
                                                <Link to={review.productId ? `/products/${review.productId}` : '#'} className="shrink-0">
                                                    <div className="w-16 h-16 border border-gray-100 rounded-sm overflow-hidden bg-white">
                                                        {review.productThumbnail ? (
                                                            <img
                                                                src={review.productThumbnail}
                                                                alt={review.productName}
                                                                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Header: Name & Action */}
                                                    <div className="flex justify-between items-start">
                                                        <Link
                                                            to={review.productId ? `/products/${review.productId}` : '#'}
                                                            className="font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-1 text-base max-w-[80%]"
                                                            title={review.productName}
                                                        >
                                                            {review.productName || "Sản phẩm"}
                                                        </Link>

                                                        {/* Actions (Edit/View) */}
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2 border-dashed">
                                                                Sửa
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Rating & Date */}
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <div className="flex">{renderStars(review.rating)}</div>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>

                                                    {/* Review Text - No more gray box */}
                                                    <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                                                        {review.comment ? (
                                                            <p className="line-clamp-3">{review.comment}</p>
                                                        ) : (
                                                            <span className="text-gray-400 italic font-light">Không có lời bình</span>
                                                        )}
                                                    </div>

                                                    {/* Mobile/Lazy Action: View Product Link removed to reduce noise, Image/Title are links already */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                                            <Pagination
                                                currentPage={currentPage}
                                                itemsPerPage={itemsPerPage}
                                                setCurrentPage={setCurrentPage}
                                                setItemsPerPage={setItemsPerPage}
                                                totalPages={totalPages}
                                                totalElements={totalElements}
                                                showItemsPerPageSelect={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
