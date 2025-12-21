import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Package, Star } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/services/productApi";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { ProductResponse } from "@/types/product";
import Pagination from "@/components/rickTexts/Pagination";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import HasPermission from "@/page/commons/HasPermission";
import { formatISO } from "@/utils/convertHelper";
import ProductForm from "@/components/rickTexts/ProductForm";

export default function ProductManagementPage() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Form dialog
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);

    const fetchProducts = async (page: number, size: number, keyword: string) => {
        setIsLoading(true);
        try {
            const res = (await getProducts({ page: page - 1, size, keyword: keyword || undefined })).data.data;
            if (res) {
                setProducts(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể tải danh sách sản phẩm"));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch products when page, itemsPerPage or search changes
    useEffect(() => {
        void fetchProducts(currentPage, itemsPerPage, searchKeyword);
    }, [currentPage, itemsPerPage, searchKeyword]);

    // Reset to page 1 only when search keyword changes
    useEffect(() => {
        if (searchKeyword !== "") {
            setCurrentPage(1);
        }
    }, [searchKeyword]);

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (product: ProductResponse) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (formData: FormData, id?: number) => {
        try {
            if (id) {
                await updateProduct(id, formData);
                toast.success("Cập nhật sản phẩm thành công");
            } else {
                await createProduct(formData);
                toast.success("Tạo sản phẩm thành công");
            }
            void fetchProducts(currentPage, itemsPerPage, searchKeyword);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể lưu sản phẩm"));
            throw err;
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteProduct(id);
            toast.success("Xóa sản phẩm thành công");
            void fetchProducts(currentPage, itemsPerPage, searchKeyword);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể xóa sản phẩm"));
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                <p className="text-sm text-gray-500">Quản lý các sản phẩm trong cửa hàng</p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center justify-between gap-4">
                {/* Left: Search */}
                <div className="flex items-center gap-2">
                    <div className="relative w-[280px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Tìm theo tên sản phẩm hoặc Product..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" onClick={() => void fetchProducts(currentPage, itemsPerPage, searchKeyword)}>
                        Tìm kiếm
                    </Button>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2">
                    <HasPermission perm="POST /api/products">
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm sản phẩm
                        </Button>
                    </HasPermission>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                        <TableRow>
                            <TableHead className="w-[100px] text-center font-semibold text-gray-700">Ảnh</TableHead>
                            <TableHead className="font-semibold text-gray-700">Tên sản phẩm</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 min-w-[120px]">Giá</TableHead>
                            <TableHead className="font-semibold text-gray-700">Danh mục</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Đánh giá</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Ngày tạo</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <div className="flex justify-center py-6">
                                        <LoadingSpinner />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <EmptyState
                                        title="Không có sản phẩm nào"
                                        description="Thêm sản phẩm mới để bắt đầu"
                                        icon={<Package className="mb-4 h-12 w-12 text-muted-foreground" />}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id} className="hover:bg-gray-50/50">
                                    <TableCell className="text-center py-3">
                                        <div className="h-16 w-16 mx-auto rounded-md border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                                            <img
                                                src={product.thumbnail || "/placeholder.png"}
                                                alt={product.name}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[250px] font-medium align-top py-4">
                                        <div className="line-clamp-2" title={product.name}>
                                            {product.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right align-top py-4">
                                        <div className="flex flex-col items-end gap-0.5">
                                            {product.discountPrice ? (
                                                <>
                                                    <span className="font-bold text-red-600">
                                                        {formatPrice(product.discountPrice)}
                                                    </span>
                                                    <span className="text-xs text-slate-400 line-through">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {product.categories?.slice(0, 2).map((cat) => (
                                                <Badge key={cat.id} variant="secondary" className="text-xs font-normal bg-slate-100 hover:bg-slate-200 text-slate-700 border-none">
                                                    {cat.name}
                                                </Badge>
                                            ))}
                                            {product.categories?.length > 2 && (
                                                <Badge variant="outline" className="text-xs text-gray-500">
                                                    +{product.categories.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center align-top py-4">
                                        <div className="flex items-center justify-center gap-1 bg-yellow-50 rounded-full px-2 py-0.5 w-fit mx-auto border border-yellow-100">
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium text-yellow-700">{product.averageRating?.toFixed(1) || "0.0"}</span>
                                            <span className="text-xs text-yellow-600/60">({product.reviewCount || 0})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center align-top py-4 text-sm text-gray-500">
                                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString("vi-VN") : "—"}
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <HasPermission perm="PUT /api/products/{id}">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-blue-50/50"
                                                    onClick={() => handleOpenEdit(product)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </HasPermission>
                                            <HasPermission perm="DELETE /api/products/{id}">
                                                <DeleteConfirmDialog onConfirm={() => handleDelete(product.id)}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50/50">
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
            {/* Product Form Dialog */}
            <ProductForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                initialData={editingProduct}
                onSubmit={handleFormSubmit}
            />
        </div>
    );
}
