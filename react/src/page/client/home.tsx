import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/services/productApi";
import { getCategories } from "@/services/categoryApi";
import type { ProductResponse } from "@/types/product.d.ts";
import type { CategoryResponse } from "@/types/category.d.ts";
import {
    Truck,
    RotateCcw,
    ShieldCheck,
    Headphones,
    Zap,
    ChevronRight,
    Smartphone,
    Laptop,
    Watch,
    Headphones as HeadphonesIcon,
    Gamepad2,
    Camera,
    Cpu,
    MonitorPlay,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/rickTexts/ProductCard";

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
    "Điện thoại": <Smartphone className="w-6 h-6" />,
    "Laptop": <Laptop className="w-6 h-6" />,
    "Đồng hồ": <Watch className="w-6 h-6" />,
    "Tai nghe": <HeadphonesIcon className="w-6 h-6" />,
    "Gaming": <Gamepad2 className="w-6 h-6" />,
    "Máy ảnh": <Camera className="w-6 h-6" />,
    "Linh kiện": <Cpu className="w-6 h-6" />,
    "Màn hình": <MonitorPlay className="w-6 h-6" />,
};

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [productsRes, categoriesRes] = await Promise.all([
                    getProducts({ page: 0, size: 10 }),
                    getCategories({ page: 0, size: 10 }),
                ]);
                setFeaturedProducts(productsRes.data.data.content || []);
                setCategories(categoriesRes.data.data.content || []);
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast.error("Không thể tải dữ liệu trang chủ");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Flash sale countdown (demo - static for now)
    const [countdown, setCountdown] = useState({ hours: 2, minutes: 34, seconds: 56 });
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                let { hours, minutes, seconds } = prev;
                seconds--;
                if (seconds < 0) { seconds = 59; minutes--; }
                if (minutes < 0) { minutes = 59; hours--; }
                if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
                return { hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (n: number) => n.toString().padStart(2, '0');

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            {/* TRUST BANNER - Thin bar at top */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-center gap-8 py-2 text-xs text-gray-600 overflow-x-auto">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Truck className="w-4 h-4 text-[#ee4d2d]" />
                            <span>Miễn phí vận chuyển</span>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <RotateCcw className="w-4 h-4 text-[#ee4d2d]" />
                            <span>Đổi trả 30 ngày</span>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <ShieldCheck className="w-4 h-4 text-[#ee4d2d]" />
                            <span>Hàng chính hãng 100%</span>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Headphones className="w-4 h-4 text-[#ee4d2d]" />
                            <span>Hỗ trợ 24/7</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* HERO SECTION - Shopee Style Banner Carousel */}
            <section className="bg-[#ee4d2d]">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* Main Banner */}
                        <div className="lg:col-span-2 relative rounded-sm overflow-hidden h-[280px] md:h-[320px] bg-gradient-to-r from-orange-500 to-red-500">
                            <div className="absolute inset-0 flex items-center p-8">
                                <div className="text-white z-10 max-w-md">
                                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-medium mb-3">
                                        <Zap className="w-3 h-3" />
                                        FLASH SALE
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Siêu Sale Cuối Năm</h1>
                                    <p className="text-white/80 text-sm mb-4">Giảm đến 50% cho tất cả sản phẩm công nghệ</p>
                                    <Link to="/products">
                                        <Button className="bg-white text-[#ee4d2d] hover:bg-gray-100 font-bold px-6 h-10 rounded-sm shadow-lg">
                                            Mua ngay
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=400&fit=crop"
                                alt="Sale Banner"
                                className="absolute right-0 bottom-0 w-1/2 h-full object-cover opacity-30 lg:opacity-100"
                            />
                        </div>

                        {/* Side Banners */}
                        <div className="hidden lg:flex flex-col gap-3">
                            <div className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm overflow-hidden relative">
                                <div className="p-4 text-white">
                                    <p className="text-xs font-medium opacity-80">Mới về</p>
                                    <p className="font-bold">iPhone 15 Pro Max</p>
                                    <p className="text-lg font-bold mt-1">34.990.000đ</p>
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&h=150&fit=crop"
                                    alt="iPhone"
                                    className="absolute right-2 bottom-2 w-20 h-20 object-contain"
                                />
                            </div>
                            <div className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-sm overflow-hidden relative">
                                <div className="p-4 text-white">
                                    <p className="text-xs font-medium opacity-80">Hot deal</p>
                                    <p className="font-bold">MacBook Air M3</p>
                                    <p className="text-lg font-bold mt-1">27.990.000đ</p>
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=150&fit=crop"
                                    alt="MacBook"
                                    className="absolute right-2 bottom-2 w-20 h-20 object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORY GRID */}
            <section className="bg-white py-4 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {categories.slice(0, 10).map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/products?categoryIds=${cat.id}`}
                                className="flex flex-col items-center justify-center p-3 rounded-sm hover:bg-gray-50 transition-colors group"
                            >
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-[#ee4d2d] group-hover:bg-orange-100 transition-colors mb-2">
                                    {categoryIcons[cat.name] || <Cpu className="w-5 h-5" />}
                                </div>
                                <span className="text-[11px] text-gray-700 text-center line-clamp-2 leading-tight font-medium">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* FLASH SALE SECTION */}
            <section className="bg-white mt-3">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-[#ee4d2d] uppercase flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Flash Sale
                            </h2>
                            {/* Countdown */}
                            <div className="flex items-center gap-1">
                                <div className="bg-[#222] text-white px-2 py-1 rounded-sm text-sm font-bold min-w-[28px] text-center">
                                    {formatTime(countdown.hours)}
                                </div>
                                <span className="text-[#ee4d2d] font-bold">:</span>
                                <div className="bg-[#222] text-white px-2 py-1 rounded-sm text-sm font-bold min-w-[28px] text-center">
                                    {formatTime(countdown.minutes)}
                                </div>
                                <span className="text-[#ee4d2d] font-bold">:</span>
                                <div className="bg-[#222] text-white px-2 py-1 rounded-sm text-sm font-bold min-w-[28px] text-center">
                                    {formatTime(countdown.seconds)}
                                </div>
                            </div>
                        </div>
                        <Link to="/products" className="text-[#ee4d2d] text-sm font-medium hover:underline flex items-center gap-1">
                            Xem tất cả
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-sm overflow-hidden">
                                    <Skeleton className="aspect-square w-full" />
                                    <div className="p-2 space-y-2">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                            {featuredProducts.slice(0, 6).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* DAILY DISCOVER / HOT PRODUCTS */}
            <section className="bg-white mt-3">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 border-b-4 border-[#ee4d2d] pb-3">
                        <h2 className="text-lg font-bold text-[#ee4d2d] uppercase">
                            Gợi ý hôm nay
                        </h2>
                    </div>

                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-sm overflow-hidden">
                                    <Skeleton className="aspect-square w-full" />
                                    <div className="p-2 space-y-2">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    <div className="text-center mt-6">
                        <Link to="/products">
                            <Button variant="outline" className="border-[#ee4d2d] text-[#ee4d2d] hover:bg-orange-50 px-10 h-10 rounded-sm font-medium">
                                Xem thêm
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
