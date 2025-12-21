import { useEffect, useState } from "react";
import { Search, Edit, Plus, Package, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getInventories, createInventory, updateInventory, deleteInventory, restoreStock, getInventoryStats, getQuantitiesByProductIds } from "@/services/inventoryApi";
import { getProductById, getProducts } from "@/services/productApi";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import { getErrorMessage } from "@/features/slices/authThunk";
import type { InventoryResponse, InventoryStatsResponse } from "@/types/inventory";
import type { ProductResponse } from "@/types/product";
import Pagination from "@/components/rickTexts/Pagination";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import { formatISO } from "@/utils/convertHelper";
import HasPermission from "@/page/commons/HasPermission";

export default function InventoryManagementPage() {
    const [inventories, setInventories] = useState<InventoryResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [productQuantities, setProductQuantities] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [searchProductId, setSearchProductId] = useState("");
    const [stockStatusFilter, setStockStatusFilter] = useState<string>(""); // OUT_OF_STOCK, LOW_STOCK, IN_STOCK

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Form dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingInventory, setEditingInventory] = useState<InventoryResponse | null>(null);
    const [formProductId, setFormProductId] = useState("");
    const [formQuantity, setFormQuantity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newProductInfo, setNewProductInfo] = useState<{ id: number; name: string; } | null>(null);
    const [isCheckingProduct, setIsCheckingProduct] = useState(false);

    // Restock dialog
    const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
    const [restockQuantity, setRestockQuantity] = useState(1);

    // Stats - tổng hợp cho tất cả các trang
    const [stats, setStats] = useState<InventoryStatsResponse>({ total: 0, lowStock: 0, outOfStock: 0 });

    const fetchInventories = async (page: number, size: number, keyword?: string, stockStatus?: string) => {
        setIsLoading(true);
        try {
            const res = (await getInventories(page - 1, size, keyword || undefined, stockStatus || undefined)).data.data;
            if (res) {
                setInventories(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            }
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Không thể tải danh sách kho"));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = (await getInventoryStats()).data.data;
            if (res) {
                setStats(res);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const res = (await getProducts({ page: 0, size: 100 })).data.data;
            if (res) {
                const productsList = res.content;
                setProducts(productsList);

                // Fetch quantities for these products
                if (productsList.length > 0) {
                    const ids = productsList.map(p => p.id);
                    try {
                        const quantitiesRes = (await getQuantitiesByProductIds(ids)).data.data;
                        if (quantitiesRes) {
                            const qtyMap: Record<number, number> = {};
                            quantitiesRes.forEach(q => {
                                qtyMap[q.productId] = q.quantity;
                            });
                            setProductQuantities(qtyMap);
                        }
                    } catch (err) {
                        console.error("Failed to fetch product quantities:", err);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch products for select:", err);
        }
    };

    useEffect(() => {
        void fetchInventories(1, itemsPerPage, searchProductId || undefined, stockStatusFilter || undefined);
        void fetchStats();
        setCurrentPage(1);
    }, [itemsPerPage, searchProductId, stockStatusFilter]);

    useEffect(() => {
        void fetchInventories(currentPage, itemsPerPage, searchProductId || undefined, stockStatusFilter || undefined);
    }, [currentPage]);



    const handleOpenCreate = () => {
        setEditingInventory(null);
        setFormProductId("");
        setFormQuantity("");
        setNewProductInfo(null); // Reset product info
        setIsDialogOpen(true);
        void fetchAllProducts();
    };

    const handleOpenEdit = (inv: InventoryResponse) => {
        setEditingInventory(inv);
        setFormProductId(inv.productId.toString());
        setFormQuantity(inv.quantity.toString());
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formProductId || !formQuantity) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        setIsSubmitting(true);
        try {
            const productId = Number(formProductId);
            const quantity = Number(formQuantity);

            if (editingInventory) {
                await updateInventory(productId, { quantity });
                toast.success("Cập nhật kho thành công");
                // Don't auto-close dialog after update - let user manually close
            } else {
                await createInventory(productId, { quantity });
                toast.success("Tạo kho thành công");
                setIsDialogOpen(false);
            }
            void fetchInventories(currentPage, itemsPerPage, undefined, stockStatusFilter);
            void fetchStats(); // ✅ Refresh thống kê
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể lưu thông tin kho"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenRestock = (inv: InventoryResponse) => {
        setEditingInventory(inv);
        setRestockQuantity(1);
        setIsRestockDialogOpen(true);
    };

    const handleRestock = async () => {
        if (!editingInventory) return;
        setIsSubmitting(true);
        try {
            await restoreStock(editingInventory.productId, restockQuantity);
            toast.success("Nhập kho thành công");
            setIsRestockDialogOpen(false);
            void fetchInventories(currentPage, itemsPerPage, undefined, stockStatusFilter);
            void fetchStats(); // ✅ Refresh thống kê
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể nhập kho"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (productId: number) => {
        try {
            await deleteInventory(productId);
            toast.success("Xóa tồn kho thành công");
            void fetchInventories(currentPage, itemsPerPage, searchProductId || undefined);
            void fetchStats(); // ✅ Refresh thống kê
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể xóa tồn kho"));
        }
    };

    // Refresh handler
    const handleRefresh = () => {
        void fetchInventories(currentPage, itemsPerPage, searchProductId || undefined, stockStatusFilter || undefined);
        void fetchStats();
        toast.success("Làm mới dữ liệu thành công");
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSearchProductId("");
        setStockStatusFilter("");
    };

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { text: "Hết hàng", color: "bg-red-100 text-red-800" };
        if (quantity < 10) return { text: "Sắp hết", color: "bg-yellow-100 text-yellow-800" };
        return { text: "Còn hàng", color: "bg-green-100 text-green-800" };
    };

    // Check product info when creating
    const handleCheckProduct = async (idStr: string) => {
        if (!idStr) {
            setNewProductInfo(null);
            return;
        }
        const id = Number(idStr);
        if (isNaN(id)) return;

        setIsCheckingProduct(true);
        try {
            const res = (await getProductById(id)).data.data;
            if (res) {
                setNewProductInfo({ id: res.id, name: res.name });
            } else {
                setNewProductInfo(null);
                toast.error("Không tìm thấy sản phẩm với ID này");
            }
        } catch (err) {
            setNewProductInfo(null);
            // Không toast lỗi 404 để tránh spam nếu người dùng gõ sai
        } finally {
            setIsCheckingProduct(false);
        }
    };

    // Stats từ API (tất cả các trang)
    const lowStockCount = stats.lowStock;
    const outOfStockCount = stats.outOfStock;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý tồn kho</h1>
                <p className="text-sm text-gray-500 mt-1">Theo dõi và quản lý số lượng tồn kho sản phẩm</p>
            </div>

            {/* Stats - Compact (Clickable để filter) */}
            <div className="grid grid-cols-3 gap-2">
                <Card
                    className={`border shadow-sm cursor-pointer transition-all hover:shadow-md ${stockStatusFilter === '' ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setStockStatusFilter('')}
                >
                    <CardContent className="p-2.5 flex flex-col items-center justify-center text-center">
                        <div className="h-7 w-7 bg-blue-50 rounded-full flex items-center justify-center mb-1.5">
                            <Package className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tổng sản phẩm</p>
                        <div className="text-lg font-bold text-gray-900 leading-none mt-1">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card
                    className={`border shadow-sm cursor-pointer transition-all hover:shadow-md ${stockStatusFilter === 'LOW_STOCK' ? 'ring-2 ring-yellow-500' : ''}`}
                    onClick={() => setStockStatusFilter('LOW_STOCK')}
                >
                    <CardContent className="p-2.5 flex flex-col items-center justify-center text-center">
                        <div className="h-7 w-7 bg-yellow-50 rounded-full flex items-center justify-center mb-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sắp hết hàng</p>
                        <div className="text-lg font-bold text-yellow-600 leading-none mt-1">{lowStockCount}</div>
                    </CardContent>
                </Card>
                <Card
                    className={`border shadow-sm cursor-pointer transition-all hover:shadow-md ${stockStatusFilter === 'OUT_OF_STOCK' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setStockStatusFilter('OUT_OF_STOCK')}
                >
                    <CardContent className="p-2.5 flex flex-col items-center justify-center text-center">
                        <div className="h-7 w-7 bg-red-50 rounded-full flex items-center justify-center mb-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hết hàng</p>
                        <div className="text-lg font-bold text-red-600 leading-none mt-1">{outOfStockCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-[280px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Tìm theo tên sản phẩm hoặc Product ID"
                            value={searchProductId}
                            onChange={(e) => setSearchProductId(e.target.value)}
                            className="pl-9 pr-4 rounded-md"
                        />
                    </div>
                    <Button variant="outline" className="text-gray-600">
                        Tìm kiếm
                    </Button>
                    {(searchProductId || stockStatusFilter) && (
                        <Button
                            variant="ghost"
                            onClick={handleClearFilters}
                            className="text-gray-500 hover:text-gray-900 hover:bg-transparent px-2"
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                    {stockStatusFilter && (
                        <span className="text-sm text-gray-500">
                            Đang lọc: <span className="font-medium text-gray-700">
                                {stockStatusFilter === 'OUT_OF_STOCK' ? 'Hết hàng' :
                                    stockStatusFilter === 'LOW_STOCK' ? 'Sắp hết' :
                                        stockStatusFilter === 'IN_STOCK' ? 'Còn hàng' : 'Tất cả'}
                            </span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleRefresh} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </Button>
                    <HasPermission perm="POST /api/inventory/{productId}">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm tồn kho
                        </Button>
                    </HasPermission>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
                <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                        <TableRow>
                            <TableHead className="text-center font-semibold text-gray-700 w-[100px]">Product ID</TableHead>
                            <TableHead className="text-left font-semibold text-gray-700">Tên sản phẩm</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 w-[100px]">Số lượng</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 w-[100px]">Trạng thái</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 w-[150px]">Cập nhật lần cuối</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 w-[100px]">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <div className="flex justify-center py-6">
                                        <LoadingSpinner />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : inventories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-[400px]">
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                            <Package className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Không có dữ liệu tồn kho</h3>
                                        <p className="text-sm text-gray-500 mt-1 mb-4">Kho hàng hiện tại đang trống.</p>
                                        <HasPermission perm="POST /api/inventory/{productId}">
                                            <Button variant="outline" onClick={handleOpenCreate} className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                Thêm tồn kho đầu tiên
                                            </Button>
                                        </HasPermission>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventories.map((inv) => {
                                const status = getStockStatus(inv.quantity);
                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell className="text-center font-medium text-gray-900">{inv.productId}</TableCell>
                                        <TableCell className="text-left">
                                            <span className="font-medium text-blue-600">{inv.productName || "—"}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-semibold ${inv.quantity < 10 ? "text-red-600" : "text-gray-900"}`}>
                                                {inv.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={`${status.color} border px-2 py-0.5 rounded-full`}>
                                                {inv.quantity === 0 && <AlertTriangle className="mr-1.5 h-3 w-3" />}
                                                {status.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-600">
                                            {formatISO(inv.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <HasPermission perm="PUT /api/inventory/{productId}">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-orange-500 hover:text-orange-600"
                                                    onClick={() => handleOpenEdit(inv)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </HasPermission>
                                            <HasPermission perm="DELETE /api/inventory/{productId}">
                                                <DeleteConfirmDialog onConfirm={() => handleDelete(inv.productId)}>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-600"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </DeleteConfirmDialog>
                                            </HasPermission>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-6 overflow-hidden">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl">
                            {editingInventory ? "Cập nhật tồn kho" : "Thêm tồn kho mới"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Hiển thị thông tin sản phẩm khi đang chỉnh sửa */}
                        {editingInventory && (
                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                                <div className="grid grid-cols-[100px_1fr] gap-4 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Product ID</span>
                                        <p className="font-mono text-base font-bold text-slate-700">{editingInventory.productId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Tên sản phẩm</span>
                                        <p className="font-semibold text-gray-900 leading-tight">{editingInventory.productName || "—"}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-200">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-slate-500 text-sm">Hiện có:</span>
                                        <span className={`text-xl font-bold ${editingInventory.quantity < 10 ? "text-amber-600" : "text-emerald-700"}`}>
                                            {editingInventory.quantity}
                                        </span>
                                        <span className="text-slate-500 text-sm">sản phẩm</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Product ID - chỉ hiển thị khi tạo mới */}
                        {!editingInventory && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Chọn sản phẩm *</Label>
                                    <Select
                                        value={formProductId}
                                        onValueChange={(val) => {
                                            setFormProductId(val);
                                            const selected = products.find(p => p.id.toString() === val);
                                            if (selected) {
                                                setNewProductInfo({ id: selected.id, name: selected.name });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-11 border-slate-300 focus:ring-blue-500">
                                            <SelectValue placeholder="Chọn sản phẩm để nhập kho" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {products.length === 0 ? (
                                                <div className="p-2 text-sm text-center text-gray-500">
                                                    Đang tải hoặc không có sản phẩm...
                                                </div>
                                            ) : (
                                                products.map((product) => {
                                                    const qty = productQuantities[product.id] ?? 0;
                                                    const isDisabled = qty > 0;
                                                    return (
                                                        <SelectItem
                                                            key={product.id}
                                                            value={product.id.toString()}
                                                            disabled={isDisabled}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span className="font-mono font-medium text-slate-500 mr-3">
                                                                #{product.id}
                                                            </span>
                                                            <span className="font-medium text-slate-900 truncate max-w-[200px] inline-block align-bottom">
                                                                {product.name}
                                                            </span>
                                                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isDisabled ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                                {isDisabled ? `Đã có: ${qty}` : 'Chưa có tồn kho'}
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {newProductInfo && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Package className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Sản phẩm hợp lệ</p>
                                            <p className="text-sm text-green-700 font-semibold mt-0.5">{newProductInfo.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-slate-700 font-medium">
                                {editingInventory ? "Số lượng mới (Ghi đè)" : "Số lượng ban đầu *"}
                            </Label>
                            <Input
                                type="number"
                                value={formQuantity}
                                onChange={(e) => setFormQuantity(e.target.value)}
                                placeholder={editingInventory ? "Nhập số lượng mới..." : "0"}
                                className="h-11 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                onFocus={(e) => e.target.select()}
                                autoFocus={!!editingInventory}
                            />
                            {editingInventory && (
                                <p className="text-xs text-slate-500">
                                    Lưu ý: Giá trị này sẽ <span className="font-semibold text-slate-700">thay thế hoàn toàn</span> số lượng hiện tại.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            {isSubmitting ? "Đang lưu..." : editingInventory ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restock Dialog */}
            <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nhập thêm hàng (Restore Stock)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Số lượng nhập thêm</Label>
                            <Input
                                type="number"
                                min={1}
                                value={restockQuantity}
                                onChange={(e) => setRestockQuantity(Number(e.target.value))}
                            />
                            <p className="text-sm text-gray-500">
                                Số lượng này sẽ được cộng thêm vào tồn kho hiện tại.
                            </p>
                        </div>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleRestock} disabled={isSubmitting}>
                            {isSubmitting ? "Đang xử lý..." : "Xác nhận nhập kho"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
