import { useEffect, useState } from "react";
import { Search, Trash2, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { searchReviews, deleteReview } from "@/services/reviewApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { ReviewResponse } from "@/types/review";
import Pagination from "@/components/rickTexts/Pagination";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import HasPermission from "@/page/commons/HasPermission";
import { formatISO } from "@/utils/convertHelper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ReviewManagementPage() {
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchReviews = async (page: number, size: number, keyword: string) => {
        setIsLoading(true);
        try {
            const res = await searchReviews(keyword || undefined, page - 1, size);
            if (res) {
                setReviews(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải danh sách đánh giá"));
        } finally {
            setIsLoading(false);
        }
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        void fetchReviews(1, itemsPerPage, searchKeyword);
        setCurrentPage(1);
    }, [itemsPerPage, searchKeyword]);

    // Fetch when page changes
    useEffect(() => {
        void fetchReviews(currentPage, itemsPerPage, searchKeyword);
    }, [currentPage]);

    const handleDelete = async (id: number) => {
        try {
            await deleteReview(id);
            toast.success("Xóa đánh giá thành công");
            void fetchReviews(currentPage, itemsPerPage, searchKeyword);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể xóa đánh giá"));
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
                    <p className="text-sm text-gray-500">Kiểm duyệt và quản lý đánh giá sản phẩm</p>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tìm kiếm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Tìm theo nội dung, email người dùng..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" onClick={() => setSearchKeyword("")}>
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-blue-600">
                <Table>
                    <TableHeader className="bg-blue-600">
                        <TableRow>
                            <TableHead className="text-center font-bold text-white">Người đánh giá</TableHead>
                            <TableHead className="text-center font-bold text-white">Đánh giá</TableHead>
                            <TableHead className="font-bold text-white">Nội dung</TableHead>
                            <TableHead className="text-center font-bold text-white">Ngày tạo</TableHead>
                            <TableHead className="text-center font-bold text-white">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <div className="flex justify-center py-6">
                                        <LoadingSpinner />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : reviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <EmptyState
                                        title="Không có đánh giá nào"
                                        description="Chưa có đánh giá nào được tạo"
                                        icon={<MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            reviews.map((review) => (
                                <TableRow key={review.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={review.avatar || undefined} />
                                                <AvatarFallback>
                                                    {review.userName?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{review.userName}</p>
                                                <p className="text-xs text-gray-500">{review.userEmail}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderStars(review.rating)}
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <p className="line-clamp-2 text-sm text-gray-600">
                                            {review.comment || <span className="italic text-gray-400">Không có bình luận</span>}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                        {formatISO(review.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <HasPermission perm="DELETE /api/reviews/{id}">
                                                <DeleteConfirmDialog onConfirm={() => handleDelete(review.id)}>
                                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </DeleteConfirmDialog>
                                            </HasPermission>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
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
    );
}
