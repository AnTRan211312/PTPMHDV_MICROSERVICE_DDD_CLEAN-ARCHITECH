import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Layers, FolderTree, Eye, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryById } from "@/services/categoryApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";
import Pagination from "@/components/rickTexts/Pagination";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import HasPermission from "@/page/commons/HasPermission";
import { formatISO } from "@/utils/convertHelper";
import { CategoryForm } from "@/components/rickTexts/CategoryForm";

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | undefined>(undefined);

    const fetchCategories = async (page: number, size: number, keyword: string) => {
        setIsLoading(true);
        try {
            const res = (await getCategories({ page: page - 1, size, keyword: keyword || undefined })).data.data;
            if (res) {
                setCategories(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            }
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể tải danh sách danh mục"));
        } finally {
            setIsLoading(false);
        }
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        void fetchCategories(1, itemsPerPage, searchKeyword);
        setCurrentPage(1);
    }, [itemsPerPage, searchKeyword]);

    // Fetch when page changes
    useEffect(() => {
        void fetchCategories(currentPage, itemsPerPage, searchKeyword);
    }, [currentPage]);

    const handleCreate = async (data: CreateCategoryRequest) => {
        try {
            await createCategory(data);
            toast.success("Tạo danh mục thành công");
            setIsDialogOpen(false);
            void fetchCategories(1, itemsPerPage, searchKeyword);
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể tạo danh mục"));
        }
    };

    const handleUpdate = async (data: UpdateCategoryRequest) => {
        try {
            if (!selectedCategory) return;
            await updateCategory(selectedCategory.id, data);
            toast.success("Cập nhật danh mục thành công");
            // Don't auto-close dialog after update - let user manually close
            void fetchCategories(currentPage, itemsPerPage, searchKeyword);
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể cập nhật danh mục"));
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id);
            toast.success("Xóa danh mục thành công");
            void fetchCategories(currentPage, itemsPerPage, searchKeyword);
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể xóa danh mục"));
        }
    };

    const openCreateDialog = () => {
        setSelectedCategory(undefined);
        setIsDialogOpen(true);
    };

    const openEditDialog = async (category: CategoryResponse) => {
        try {
            const res = await getCategoryById(category.id);
            setSelectedCategory(res.data.data);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Failed to fetch category details", error);
            toast.error("Không thể tải thông tin danh mục");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats in one flowing section or compact grid */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý danh mục</h1>
                        <p className="text-sm text-gray-500">Tổng quan và quản lý danh mục sản phẩm</p>
                    </div>
                </div>

                {/* Compact Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Stats - Compact */}
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tổng danh mục</p>
                                <h3 className="text-2xl font-bold text-gray-900">{totalElements}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Stats - Compact */}
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                <Eye className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hiển thị</p>
                                <h3 className="text-2xl font-bold text-gray-900">{categories.length}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Status - Compact */}
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái</p>
                                <h3 className="text-xl font-bold text-emerald-600">Hoạt động</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-gray-100 shadow-sm border-t-4 border-t-blue-600">
                <CardContent className="p-0">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm danh mục..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="pl-9 bg-white border-gray-200 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <HasPermission perm="POST /api/categories">
                                <Button className="bg-blue-600 hover:bg-blue-700 font-medium shadow-sm transition-all hover:shadow" onClick={openCreateDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm mới
                                </Button>
                            </HasPermission>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-100 border-b border-gray-200">
                                <TableRow className="hover:bg-transparent border-gray-200">
                                    <TableHead className="w-[50px] font-bold text-gray-700">#</TableHead>
                                    <TableHead className="font-bold text-gray-700">Tên danh mục</TableHead>
                                    <TableHead className="font-bold text-gray-700 w-[400px]">Mô tả</TableHead>
                                    <TableHead className="font-bold text-gray-700 whitespace-nowrap">Ngày tạo</TableHead>
                                    <TableHead className="font-bold text-gray-700 whitespace-nowrap">Cập nhật</TableHead>
                                    <TableHead className="text-right font-bold text-gray-700 w-[100px]">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center">
                                                <LoadingSpinner />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-[300px]">
                                            <EmptyState
                                                title="Không tìm thấy danh mục"
                                                description={searchKeyword ? `Không có kết quả cho "${searchKeyword}"` : "Chưa có danh mục nào được tạo"}
                                                icon={<FolderTree className="h-12 w-12 text-gray-300 mb-3" />}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((category, index) => (
                                        <TableRow key={category.id} className="group hover:bg-blue-50/50 even:bg-gray-50/50 transition-colors border-gray-100">
                                            <TableCell className="text-gray-500 font-mono text-xs font-semibold">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    {category.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm line-clamp-1 max-w-[400px]">
                                                {category.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                                                {formatISO(category.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                                                {formatISO(category.updatedAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <HasPermission perm="PUT /api/categories/{id}">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 border border-blue-100"
                                                            onClick={() => openEditDialog(category)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </HasPermission>
                                                    <HasPermission perm="DELETE /api/categories/{id}">
                                                        <DeleteConfirmDialog onConfirm={() => handleDelete(category.id)}>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-500 bg-red-50/80 hover:bg-red-100 hover:text-red-600 border border-red-100"
                                                            >
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
                    <div className="border-t border-gray-100 bg-gray-50/30 p-4">
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
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <CategoryForm
                        category={selectedCategory}
                        onSubmit={(data) => {
                            if (selectedCategory) {
                                return handleUpdate(data as UpdateCategoryRequest);
                            } else {
                                return handleCreate(data as CreateCategoryRequest);
                            }
                        }}
                        onCancel={() => setIsDialogOpen(false)}
                        isLoading={isLoading}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
