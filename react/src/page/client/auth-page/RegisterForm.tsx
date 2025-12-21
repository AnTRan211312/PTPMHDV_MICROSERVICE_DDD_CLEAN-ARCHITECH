import { getErrorMessage } from "@/features/slices/authThunk";
import { registerApi } from "@/services/authApi";
import type { RegisterRequest } from "@/types/auth";
import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
// Import Icon từ thư viện lucide-react (Cần cài đặt: npm i lucide-react)
import {
    User, Mail, Lock, Phone, Calendar, MapPin,
    ArrowRight,
    Loader2,
    ShoppingBag,
} from "lucide-react";

export default function RegisterForm() {
    // --- GIỮ NGUYÊN LOGIC CŨ ---
    const [form, setForm] = useState<RegisterRequest>({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        dateBirth: "",
        address: "",
        gender: "OTHER",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateEmail = (email: string): boolean => {
        const regex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
        return regex.test(email);
    };

    const validateDateOfBirth = (dateStr: string): boolean => {
        if (!dateStr) return true;
        const birthDate = new Date(dateStr);
        const today = new Date();
        const minDate = new Date(
            today.getFullYear() - 120,
            today.getMonth(),
            today.getDate(),
        );
        return birthDate <= today && birthDate >= minDate;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if (!form.name || !form.email || !form.password || !form.phoneNumber) {
                setError("Vui lòng điền đầy đủ: Tên, Email, Mật khẩu và Số điện thoại.");
                return;
            }
            if (!validateEmail(form.email)) {
                setError("Email không hợp lệ.");
                return;
            }
            const phoneRegex = /^0[0-9]{9}$/;
            if (!phoneRegex.test(form.phoneNumber)) {
                setError("Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng 0).");
                return;
            }
            if (form.password.length < 6) {
                setError("Mật khẩu phải có ít nhất 6 ký tự.");
                return;
            }
            if (form.dateBirth && !validateDateOfBirth(form.dateBirth)) {
                setError("Ngày sinh không hợp lệ.");
                return;
            }
            await registerApi(form);
            toast.info("Đăng ký thành công, vui lòng đăng nhập lại");
            navigate("/auth?mode=login");
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsLoading(false);
            setError("");
        }
    };

    // --- PHẦN GIAO DIỆN ĐƯỢC LÀM MỚI (LOGIC GIỮ NGUYÊN) ---
    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <div className="mb-8 text-left">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#ee4d2d]">
                    <ShoppingBag size={14} />
                    <span>E-Commerce Member</span>
                </div>
                <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    Tạo tài khoản mới
                </h1>
                <p className="text-gray-500 text-sm">
                    Nhập thông tin của bạn để bắt đầu mua sắm & nhận ưu đãi.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Grid Layout cho các trường ngắn */}
                <div className="grid gap-5 md:grid-cols-2">
                    {/* Name Field */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                    </div>

                    {/* Phone Number Field */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                                placeholder="09xxx"
                            />
                        </div>
                    </div>
                </div>

                {/* Email Field */}
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    {/* Date of Birth */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Ngày sinh
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <Calendar size={18} />
                            </div>
                            <input
                                type="date"
                                name="dateBirth"
                                value={form.dateBirth ?? ""}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                                max={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Giới tính
                        </label>
                        <div className="relative">
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Địa chỉ
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <MapPin size={18} />
                        </div>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                            placeholder="Số nhà, đường, phường/xã..."
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 flex-shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#ee4d2d]/25 transition-all hover:bg-[#d04126] hover:shadow-[#ee4d2d]/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Đang xử lý...</span>
                        </>
                    ) : (
                        <>
                            <span>Đăng ký ngay</span>
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 mb-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300">
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                    Facebook
                </button>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center text-sm text-gray-600">
                Đã là thành viên?{" "}
                <Link
                    to="/auth?mode=login"
                    className="font-bold text-[#ee4d2d] hover:text-[#d04126] hover:underline"
                >
                    Đăng nhập tại đây
                </Link>
            </div>
        </div>
    );
}