import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ImageOff } from "lucide-react";
import type { ProductResponse } from "@/types/product.d.ts";
import { Link } from "react-router-dom";

interface ProductCardProps {
    product: ProductResponse;
    stockQuantity?: number;
    onClick?: () => void;
}

// Format sold count like Shopee (1k, 2.5k, etc.)
const formatSoldCount = (count: number): string => {
    if (count >= 1000) {
        const k = count / 1000;
        return k >= 10 ? `${Math.floor(k)}k` : `${k.toFixed(1).replace('.0', '')}k`;
    }
    return count.toString();
};

// Placeholder image component
const ImagePlaceholder = () => (
    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1">
        <ImageOff className="w-8 h-8 text-gray-300" />
        <span className="text-[10px] text-gray-400">Không có ảnh</span>
    </div>
);

export function ProductCard({ product, stockQuantity, onClick }: ProductCardProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const isOutOfStock = stockQuantity === 0;

    const discountPercent = product.discountPrice && product.discountPrice < product.price
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : 0;

    const currentPrice = product.discountPrice || product.price;

    // Simulated sold count (in real app, this would come from backend)
    const soldCount = product.reviewCount > 0 ? product.reviewCount * 7 + 12 : 0;

    return (
        <Card className={`
            group relative bg-white rounded-sm overflow-hidden flex flex-col h-full
            border border-transparent hover:border-[#ee4d2d]
            shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] hover:shadow-md
            transition-all duration-150 ease-out
            ${isOutOfStock ? "opacity-60 grayscale pointer-events-none" : ""}
        `}>
            {/* IMAGE CONTAINER - Fixed 1:1 Aspect Ratio with white background */}
            <div className="relative aspect-square bg-white w-full overflow-hidden">
                <Link to={`/products/${product.id}`} onClick={onClick} className="block w-full h-full">
                    {imageError ? (
                        <ImagePlaceholder />
                    ) : (
                        <>
                            {/* Skeleton while loading */}
                            {imageLoading && (
                                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                            )}
                            <img
                                src={product.thumbnail || "https://placehold.co/400x400/ffffff/e5e7eb?text=No+Image"}
                                alt={product.name}
                                className={`
                                    w-full h-full object-contain p-2
                                    bg-white
                                    ${imageLoading ? 'opacity-0' : 'opacity-100'}
                                    transition-opacity duration-200
                                `}
                                onLoad={() => setImageLoading(false)}
                                onError={() => {
                                    setImageError(true);
                                    setImageLoading(false);
                                }}
                                loading="lazy"
                            />
                        </>
                    )}

                    {/* OVERLAY for Sold Out */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <span className="bg-gray-800 text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase">
                                Hết hàng
                            </span>
                        </div>
                    )}
                </Link>

                {/* DISCOUNT BADGE - Top Right (Shopee Style) */}
                {discountPercent > 0 && (
                    <div className="absolute top-0 right-0 bg-[#ffeb3b] text-[#ee4d2d] min-w-[36px] text-center">
                        <div className="px-1 pt-0.5 pb-1">
                            <span className="block text-xs font-bold leading-none">{discountPercent}%</span>
                            <span className="block text-[8px] font-bold leading-none mt-0.5">GIẢM</span>
                        </div>
                        {/* Triangle bottom */}
                        <div className="w-full overflow-hidden leading-[0]">
                            <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#ffeb3b] mx-auto"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <CardContent className="p-2 flex-1 flex flex-col justify-between">
                {/* Product Name */}
                <Link to={`/products/${product.id}`} onClick={onClick} className="block">
                    <h3 className="text-xs text-gray-800 line-clamp-2 leading-4 font-normal hover:text-[#ee4d2d] transition-colors min-h-[32px]">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto pt-1">
                    {/* Price Section */}
                    <div className="flex items-baseline flex-wrap gap-1">
                        <span className="text-sm font-medium text-[#ee4d2d]">
                            <span className="text-[10px] underline align-top mr-px">đ</span>
                            {currentPrice.toLocaleString('vi-VN')}
                        </span>
                        {discountPercent > 0 && (
                            <span className="text-[11px] text-gray-400 line-through">
                                đ{product.price.toLocaleString('vi-VN')}
                            </span>
                        )}
                    </div>

                    {/* Rating & Sold Count */}
                    <div className="flex items-center justify-between mt-1.5">
                        {/* Stars */}
                        <div className="flex items-center gap-px">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-2.5 h-2.5 ${i < Math.floor(product.averageRating)
                                        ? "fill-[#ffce3d] text-[#ffce3d]"
                                        : "fill-gray-200 text-gray-200"
                                        }`}
                                />
                            ))}
                        </div>
                        {/* Sold Count */}
                        <span className="text-[10px] text-gray-500">
                            Đã bán {formatSoldCount(soldCount)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
