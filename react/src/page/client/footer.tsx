import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="inline-block mb-3">
                            <h3 className="text-xl font-bold text-white">Buyio</h3>
                        </Link>
                        <p className="text-xs text-gray-400 mb-4 max-w-xs leading-relaxed">
                            Cửa hàng trực tuyến hàng đầu với hàng ngàn sản phẩm công nghệ chất lượng cao.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-600 flex items-center justify-center transition-all group" title="Facebook">
                                <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-pink-600 flex items-center justify-center transition-all group" title="Instagram">
                                <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-600 flex items-center justify-center transition-all group" title="Youtube">
                                <Youtube className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-400 flex items-center justify-center transition-all group" title="Twitter">
                                <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Grouped for better spacing */}
                    <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {/* Adjusted grid cols to fit tighter */}
                        <div>
                            <h4 className="text-white font-bold mb-3 uppercase text-[10px] tracking-widest">Danh mục</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link to="/products" className="hover:text-[#ee4d2d] transition-colors">Tất cả sản phẩm</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Sản phẩm mới</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Khuyến mãi</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Bản chạy nhất</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-3 uppercase text-[10px] tracking-widest">Hỗ trợ</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Liên hệ</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Câu hỏi thường gặp</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Vận chuyển</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Trả hàng</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-3 uppercase text-[10px] tracking-widest">Công ty</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Về chúng tôi</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Điều khoản</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Bảo mật</Link></li>
                                <li><Link to="#" className="hover:text-[#ee4d2d] transition-colors">Tuyển dụng</Link></li>
                            </ul>
                        </div>

                        {/* Contact moved into grid for compactness */}
                        <div className="sm:col-span-1">
                            <h4 className="text-white font-bold mb-3 uppercase text-[10px] tracking-widest">Liên hệ</h4>
                            <ul className="space-y-3 text-xs">
                                <li className="flex items-center gap-2 group">
                                    <div className="w-6 h-6 rounded bg-[#ee4d2d]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee4d2d] transition-colors">
                                        <Mail className="w-3 h-3 text-[#ee4d2d] group-hover:text-white transition-colors" />
                                    </div>
                                    <a href="mailto:support@buyio.com" className="hover:text-[#ee4d2d] transition-colors truncate">
                                        support@buyio.com
                                    </a>
                                </li>
                                <li className="flex items-center gap-2 group">
                                    <div className="w-6 h-6 rounded bg-[#ee4d2d]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee4d2d] transition-colors">
                                        <Phone className="w-3 h-3 text-[#ee4d2d] group-hover:text-white transition-colors" />
                                    </div>
                                    <a href="tel:+84123456789" className="hover:text-[#ee4d2d] transition-colors">
                                        0123 456 789
                                    </a>
                                </li>
                                <li className="flex items-center gap-2 group">
                                    <div className="w-6 h-6 rounded bg-[#ee4d2d]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee4d2d] transition-colors">
                                        <MapPin className="w-3 h-3 text-[#ee4d2d] group-hover:text-white transition-colors" />
                                    </div>
                                    <span>TP. HCM</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Empty col for spacing/balance if needed, or remove lg:col-span-5 structure */}
                </div>

                {/* Payment Methods */}
                <div className="border-t border-white/5 pt-6 pb-2">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 opacity-90 hover:opacity-100">
                                <div className="bg-white p-1 rounded h-6 w-10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-full w-auto object-contain" />
                                </div>
                                <div className="bg-white p-1 rounded h-6 w-10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-full w-auto object-contain" />
                                </div>
                                <div className="bg-white p-1 rounded h-6 w-10 flex items-center justify-center">
                                    <img src="https://vnpay.vn/s1/i.vnpay.vn/portal/uploads/images/2022/vnpaylogo.png" alt="VNPay" className="h-full w-auto object-contain" />
                                </div>
                                <div className="bg-white p-1 rounded h-6 w-10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="Momo" className="h-full w-auto object-contain" />
                                </div>
                                <div className="bg-white p-1 rounded h-6 w-10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/vi/7/77/ZaloPay_Logo.png" alt="ZaloPay" className="h-full w-auto object-contain" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center md:text-right">
                            <p className="text-[10px] text-gray-500 font-medium">
                                © 2025 <span className="text-[#ee4d2d] font-bold">Buyio</span>. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
