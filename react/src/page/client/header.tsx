import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/features/hooks";
import UserMenu from "@/page/commons/UserMenu.tsx";
import { NotificationBell } from "@/page/commons/NotificationBell";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCart, resetCart } from "@/features/slices/cartSlice";

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLogin } = useAppSelector((state) => state.auth);
    const { cart } = useAppSelector((state) => state.cart);

    // Handle search submit
    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    useEffect(() => {
        if (isLogin) {
            dispatch(fetchCart());
        } else {
            dispatch(resetCart());
        }
    }, [isLogin, dispatch]);

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Main Header - Shopee Style with Gradient */}
            <div className="bg-gradient-to-r from-[#f53d2d] to-[#f63] shadow-sm">
                {/* Top bar - optional links */}
                <div className="hidden lg:block border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[11px] text-white/80 py-1">
                        <div className="flex items-center gap-4">
                            <span>Kênh Người Bán</span>
                            <span>Trở thành Người bán</span>
                            <span>Tải ứng dụng</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Kết nối</span>
                            <span>|</span>
                            {!isLogin && (
                                <>
                                    <Link to="/auth?mode=register" className="hover:text-white transition">Đăng Ký</Link>
                                    <span>|</span>
                                    <Link to="/auth?mode=login" className="hover:text-white transition">Đăng Nhập</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main header content */}
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-4 lg:gap-8">
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                                Buyio
                            </span>
                        </Link>

                        {/* Search Bar - Shopee Style with Border Group */}
                        <div className="flex-1 hidden lg:block">
                            <form onSubmit={handleSearch} className="flex bg-white rounded-sm overflow-hidden shadow-sm">
                                <div className="flex-1 relative">
                                    <Input
                                        type="text"
                                        placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 w-full border-0 bg-transparent text-gray-800 placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm px-3"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="h-10 px-5 rounded-none bg-[#fb5533] hover:bg-[#d0011b] text-white font-medium shadow-none border-0"
                                >
                                    <Search className="w-5 h-5" />
                                </Button>
                            </form>
                            {/* Quick search tags */}
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-white/80">
                                <span className="font-medium">Hot:</span>
                                <Link to="/products?keyword=iphone" className="hover:text-white hover:underline transition">iPhone 15</Link>
                                <Link to="/products?keyword=macbook" className="hover:text-white hover:underline transition">MacBook</Link>
                                <Link to="/products?keyword=airpods" className="hover:text-white hover:underline transition">AirPods</Link>
                                <Link to="/products?keyword=samsung" className="hover:text-white hover:underline transition">Samsung</Link>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Cart */}
                            <Link to="/cart" className="relative flex items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-white" />
                                {cart && cart.items && cart.items.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-white text-[10px] text-[#ee4d2d] flex items-center justify-center font-bold px-1">
                                        {cart.items.length}
                                    </span>
                                )}
                            </Link>

                            {/* Auth */}
                            {isLogin ? (
                                <div className="flex items-center gap-2">
                                    <NotificationBell />
                                    <UserMenu />
                                </div>
                            ) : (
                                <div className="hidden lg:flex items-center gap-2 text-white text-sm">
                                    <Link to="/auth?mode=register" className="px-3 py-1.5 border border-white/50 rounded-sm hover:bg-white/10 transition">
                                        Đăng Ký
                                    </Link>
                                    <Link to="/auth?mode=login" className="px-3 py-1.5 bg-white text-[#ee4d2d] rounded-sm hover:bg-gray-100 transition font-medium">
                                        Đăng Nhập
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Toggle */}
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] p-0 border-l-0">
                                    <div className="flex flex-col h-full bg-white">
                                        {/* Header */}
                                        <div className="flex items-center justify-between bg-gradient-to-r from-[#f53d2d] to-[#f63] px-4 py-4">
                                            <span className="text-lg font-bold text-white">Menu</span>
                                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition">
                                                <X className="h-5 w-5 text-white" />
                                            </button>
                                        </div>

                                        {/* Mobile Search */}
                                        <div className="p-4 border-b border-gray-100">
                                            <form onSubmit={(e) => { handleSearch(e); setIsOpen(false); }} className="flex">
                                                <Input
                                                    placeholder="Tìm sản phẩm..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="flex-1 h-9 rounded-l-sm rounded-r-none border-gray-200 text-sm"
                                                />
                                                <Button type="submit" size="sm" className="rounded-l-none rounded-r-sm bg-[#ee4d2d] hover:bg-[#d04126]">
                                                    <Search className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>

                                        {/* Mobile Nav Links */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                                            <Link
                                                to="/"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 px-3 py-3 rounded-sm text-gray-700 hover:bg-orange-50 hover:text-[#ee4d2d] transition font-medium"
                                            >
                                                Trang chủ
                                            </Link>
                                            <Link
                                                to="/products"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 px-3 py-3 rounded-sm text-gray-700 hover:bg-orange-50 hover:text-[#ee4d2d] transition font-medium"
                                            >
                                                Sản phẩm
                                            </Link>
                                            <Link
                                                to="/cart"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 px-3 py-3 rounded-sm text-gray-700 hover:bg-orange-50 hover:text-[#ee4d2d] transition font-medium"
                                            >
                                                Giỏ hàng
                                                {cart && cart.items && cart.items.length > 0 && (
                                                    <span className="ml-auto bg-[#ee4d2d] text-white text-xs px-2 py-0.5 rounded-full">
                                                        {cart.items.length}
                                                    </span>
                                                )}
                                            </Link>
                                        </div>

                                        {/* Mobile Footer */}
                                        {!isLogin && (
                                            <div className="border-t border-gray-100 p-4 space-y-2">
                                                <Link to="/auth?mode=login" onClick={() => setIsOpen(false)}>
                                                    <Button className="w-full bg-[#ee4d2d] hover:bg-[#d04126] text-white rounded-sm h-10 font-medium">
                                                        Đăng nhập
                                                    </Button>
                                                </Link>
                                                <Link to="/auth?mode=register" onClick={() => setIsOpen(false)}>
                                                    <Button variant="outline" className="w-full border-[#ee4d2d] text-[#ee4d2d] hover:bg-orange-50 rounded-sm h-10 font-medium">
                                                        Đăng ký
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
