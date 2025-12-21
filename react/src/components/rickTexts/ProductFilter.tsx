import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryResponse } from "@/types/category.d.ts";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface ProductFilterProps {
    categories: CategoryResponse[];
    selectedCategories: number[];
    onCategoryChange: (categoryIds: number[]) => void;
    minPrice: number;
    maxPrice: number;
    onPriceChange: (min: number, max: number) => void;
    onReset: () => void;
    // Removed sortBy and onSortChange - sorting only in toolbar
}

export function ProductFilter({
    categories,
    selectedCategories,
    onCategoryChange,
    minPrice,
    maxPrice,
    onPriceChange,
    onReset,
}: ProductFilterProps) {
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        price: true,
    });

    const [showAllCategories, setShowAllCategories] = useState(false);

    const handleCategoryToggle = (categoryId: number) => {
        const newSelected = selectedCategories.includes(categoryId)
            ? selectedCategories.filter(id => id !== categoryId)
            : [...selectedCategories, categoryId];
        onCategoryChange(newSelected);
    };

    const toggleSection = (section: 'categories' | 'price') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Show first 6 categories, then allow expand
    const visibleCategories = showAllCategories
        ? categories
        : categories.slice(0, 6);

    const hasActiveFilters = selectedCategories.length > 0 || minPrice > 0 || maxPrice > 0;

    return (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-base text-gray-900 uppercase flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Bộ lọc tìm kiếm
                </h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-8 px-3 text-xs font-semibold"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Xóa
                    </Button>
                )}
            </div>

            {/* Categories Section - Accordion */}
            <div className="border-b border-gray-100 pb-2">
                <button
                    onClick={() => toggleSection('categories')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
                >
                    <span className="font-semibold text-sm text-gray-800 group-hover:text-orange-600 transition-colors">
                        Theo Danh Mục
                    </span>
                    {expandedSections.categories
                        ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                    }
                </button>

                {expandedSections.categories && categories.length > 0 && (
                    <div className="px-4 pb-4 space-y-1">
                        {visibleCategories.map((category) => (
                            <label
                                key={category.id}
                                htmlFor={`cat-${category.id}`}
                                className="flex items-start gap-3 py-1.5 cursor-pointer group"
                            >
                                <Checkbox
                                    id={`cat-${category.id}`}
                                    checked={selectedCategories.includes(category.id)}
                                    onCheckedChange={() => handleCategoryToggle(category.id)}
                                    className="h-4 w-4 mt-0.5 rounded-[2px] border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <span className={`text-sm leading-snug group-hover:text-orange-500 transition-colors ${selectedCategories.includes(category.id)
                                    ? 'text-orange-600 font-medium'
                                    : 'text-gray-700'
                                    }`}>
                                    {category.name}
                                </span>
                            </label>
                        ))}

                        {categories.length > 6 && (
                            <button
                                onClick={() => setShowAllCategories(!showAllCategories)}
                                className="pl-7 text-sm text-gray-500 hover:text-orange-600 font-medium py-1 flex items-center gap-1 transition-colors"
                            >
                                {showAllCategories
                                    ? <><ChevronUp className="w-3 h-3" /> Thu gọn</>
                                    : <><ChevronDown className="w-3 h-3" /> Thêm {categories.length - 6} danh mục</>
                                }
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Price Range Section - Accordion */}
            <div>
                <button
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
                >
                    <span className="font-semibold text-sm text-gray-800 group-hover:text-orange-600 transition-colors">
                        Khoảng Giá
                    </span>
                    {expandedSections.price
                        ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                    }
                </button>

                {expandedSections.price && (
                    <div className="px-4 pb-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                placeholder="₫ TỪ"
                                value={minPrice || ""}
                                onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
                                className="h-8 !rounded-[2px] text-xs border-gray-300 focus:border-gray-500 focus:ring-0 px-2 shadow-none bg-white placeholder:text-gray-400"
                            />
                            <span className="text-gray-400 font-light">-</span>
                            <Input
                                type="number"
                                placeholder="₫ ĐẾN"
                                value={maxPrice || ""}
                                onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
                                className="h-8 !rounded-[2px] text-xs border-gray-300 focus:border-gray-500 focus:ring-0 px-2 shadow-none bg-white placeholder:text-gray-400"
                            />
                        </div>

                        <Button
                            className="w-full h-8 bg-[#ee4d2d] hover:bg-[#d04126] text-white text-xs font-bold uppercase !rounded-[2px] shadow-sm transition-colors"
                            onClick={() => { }} // usually triggers generic apply
                        >
                            Áp dụng
                        </Button>

                        {/* Quick Price Filters */}
                        <div className="pt-1">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: "Dưới 5tr", min: 0, max: 5000000 },
                                    { label: "5-10tr", min: 5000000, max: 10000000 },
                                    { label: "10-20tr", min: 10000000, max: 20000000 },
                                    { label: "Trên 20tr", min: 20000000, max: 0 },
                                ].map((range) => (
                                    <button
                                        key={range.label}
                                        onClick={() => onPriceChange(range.min, range.max)}
                                        className={`px-3 py-1 rounded-sm text-[11px] font-medium transition-all border
                                            ${minPrice === range.min && maxPrice === range.max
                                                ? 'bg-orange-50 text-orange-600 border-orange-200'
                                                : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
