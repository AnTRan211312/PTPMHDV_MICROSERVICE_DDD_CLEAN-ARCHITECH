import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package } from "lucide-react";
import { ProductCard } from "@/components/rickTexts/ProductCard";
import { ProductFilter } from "@/components/rickTexts/ProductFilter";
import Pagination from "@/components/rickTexts/Pagination";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import { getProducts } from "@/services/productApi";
import { getCategories } from "@/services/categoryApi";
import type { ProductResponse } from "@/types/product.d.ts";
import type { CategoryResponse } from "@/types/category.d.ts";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function ProductListPage() {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Filter & Search - Read keyword from URL
    const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [sortBy, setSortBy] = useState("newest");

    // Sync URL keyword to state when URL changes
    useEffect(() => {
        const urlKeyword = searchParams.get("keyword") || "";
        if (urlKeyword !== keyword) {
            setKeyword(urlKeyword);
            setCurrentPage(1);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, itemsPerPage, keyword, sortBy, selectedCategories, minPrice, maxPrice]);

    const fetchCategories = async () => {
        try {
            const response = await getCategories({ page: 0, size: 100 });
            setCategories(response.data.data.content || []);
        } catch (error) {
            console.error("Failed to fetch categories", error);
            toast.error("Không thể tải danh mục");
        }
    };

    const fetchProducts = async () => {
        try {
            setIsLoading(true);

            // Map frontend sort to backend sort
            let sortParam = "createdAt,desc"; // Default
            switch (sortBy) {
                case "price-asc": sortParam = "price,asc"; break;
                case "price-desc": sortParam = "price,desc"; break;
                case "rating": sortParam = "averageRating,desc"; break;
                case "popular": sortParam = "reviewCount,desc"; break;
                case "newest": sortParam = "createdAt,desc"; break;
            }

            const response = await getProducts({
                page: currentPage - 1,
                size: itemsPerPage,
                keyword: keyword || undefined,
                categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
                minPrice: minPrice > 0 ? minPrice : undefined,
                maxPrice: maxPrice > 0 ? maxPrice : undefined,
                sort: sortParam
            });
            const data = response.data.data;
            setProducts(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error("Không thể tải sản phẩm");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetFilter = () => {
        setSelectedCategories([]);
        setMinPrice(0);
        setMaxPrice(0);
        setSortBy("newest");
        setKeyword("");
        setCurrentPage(1);
    };



    const sortOptions = [
        { value: "newest", label: "Mới nhất" },
        { value: "popular", label: "Phổ biến" },
        { value: "rating", label: "Đánh giá cao" },
        { value: "price-asc", label: "Giá thấp → cao" },
        { value: "price-desc", label: "Giá cao → thấp" },
    ];

    const handleCategoryChange = (ids: number[]) => {
        setSelectedCategories(ids);
        setCurrentPage(1);
    };

    const handlePriceChange = (min: number, max: number) => {
        setMinPrice(min);
        setMaxPrice(max);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Section - Compact */}
            {/* Header Section - Shopee Style (Simple White with Orange Accent) */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Sản phẩm</h1>
                            <div className="h-1 w-20 bg-orange-500 mt-2 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="hidden sm:inline">Giao nhanh • Đổi trả 30 ngày</span>
                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                                <Package className="w-4 h-4 text-orange-500" />
                                <span className="font-semibold text-orange-600 text-sm">{totalElements} sản phẩm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* FILTER SIDEBAR - Desktop Only */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <ProductFilter
                                categories={categories}
                                selectedCategories={selectedCategories}
                                onCategoryChange={handleCategoryChange}
                                minPrice={minPrice}
                                maxPrice={maxPrice}
                                onPriceChange={handlePriceChange}
                                onReset={handleResetFilter}
                            />
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 min-w-0">
                        {/* Control Bar */}
                        {/* Sort Bar - Shopee Style */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-[#ededed] p-3 rounded-sm border border-gray-200">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                <span className="text-sm font-medium text-gray-600 mr-2 whitespace-nowrap">Sắp xếp theo</span>
                                {sortOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSortBy(opt.value)}
                                        className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors whitespace-nowrap shadow-sm
                                            ${sortBy === opt.value
                                                ? "bg-orange-500 text-white border border-orange-500"
                                                : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white border-none text-sm font-medium text-gray-700 rounded-sm py-2 px-3 focus:ring-0 cursor-pointer hover:bg-gray-50"
                                >
                                    <option value={12}>12 sản phẩm</option>
                                    <option value={24}>24 sản phẩm</option>
                                    <option value={48}>48 sản phẩm</option>
                                </select>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                                        <Skeleton className="aspect-square w-full" />
                                        <div className="p-4 space-y-3">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-2/3" />
                                            <Skeleton className="h-6 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <EmptyState
                                icon={<Search className="w-16 h-16" />}
                                title="Không tìm thấy sản phẩm"
                                description="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                            />
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-10">
                                        <Pagination
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            totalPages={totalPages}
                                            totalElements={totalElements}
                                            itemsPerPage={itemsPerPage}
                                            setItemsPerPage={setItemsPerPage}
                                            showItemsPerPageSelect={false}
                                            theme="orange"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Filter Drawer */}
                    <Sheet open={showMobileFilter} onOpenChange={setShowMobileFilter}>
                        <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0 border-none">
                            <SheetHeader className="p-6 border-b border-gray-100 bg-gray-50">
                                <SheetTitle className="text-xl font-bold">Bộ lọc sản phẩm</SheetTitle>
                            </SheetHeader>
                            <div className="overflow-y-auto h-[calc(100vh-80px)]">
                                <ProductFilter
                                    categories={categories}
                                    selectedCategories={selectedCategories}
                                    onCategoryChange={handleCategoryChange}
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    onPriceChange={handlePriceChange}
                                    onReset={handleResetFilter}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    );
}
