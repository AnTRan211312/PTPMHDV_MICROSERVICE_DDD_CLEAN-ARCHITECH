import type React from "react";
import { useAppDispatch } from "@/features/hooks";
import { getErrorMessage, login } from "@/features/slices/authThunk";
import type { LoginRequest } from "@/types/auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
    Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
    ShieldCheck
} from "lucide-react";
import { getSessionMeta } from "@/utils/sessionHelper";

export default function LoginPage() {
    const [form, setForm] = useState<LoginRequest>({
        email: "",
        password: "",
        sessionMetaRequest: getSessionMeta(),
    });
    const [error, setError] = useState<string>("");
    const [emailError, setEmailError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const dispatch = useAppDispatch();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        // Inline validation for email
        if (name === "email") {
            if (value && !validateEmail(value)) {
                setEmailError("Email không hợp lệ");
            } else {
                setEmailError("");
            }
        }
    };

    const validateEmail = (email: string): boolean => {
        const regex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
        return regex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.email || !form.password) {
            setError("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (!validateEmail(form.email)) {
            setError("Email không hợp lệ.");
            return;
        }

        try {
            setIsLoading(true);
            await dispatch(login(form)).unwrap();
            // Remember me logic can be added here
            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Đăng nhập thất bại"));
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = form.email && form.password && !emailError;


    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="mb-6 text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#ee4d2d]">
                    <ShieldCheck size={14} />
                    <span>Chào mừng trở lại</span>
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                    Đăng nhập
                </h1>
                <p className="text-sm text-gray-500">
                    Nhập email và mật khẩu để truy cập vào tài khoản
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Email
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className={`w-full rounded-lg border ${emailError && form.email
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                                : "border-gray-200 focus:border-[#ee4d2d] focus:ring-[#ee4d2d]/10"
                                } bg-gray-50 py-2.5 pl-9 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-4`}
                            placeholder="example@email.com"
                            disabled={isLoading}
                        />
                    </div>
                    {emailError && form.email && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {emailError}
                        </p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-700">
                            Mật khẩu
                        </label>
                        <Link
                            to="/auth?mode=forgot-password"
                            className="text-xs font-medium text-[#ee4d2d] hover:text-[#d04126] hover:underline"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-10 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-[#ee4d2d] focus:outline-none focus:ring-4 focus:ring-[#ee4d2d]/10"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#ee4d2d] focus:ring-[#ee4d2d] focus:ring-2 accent-[#ee4d2d]"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-700">
                        Ghi nhớ đăng nhập
                    </label>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600 animate-in fade-in slide-in-from-top-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-[#ee4d2d] py-2.5 text-sm font-bold text-white shadow-lg shadow-[#ee4d2d]/25 transition-all hover:bg-[#d04126] hover:shadow-[#ee4d2d]/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[#ee4d2d]/25"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Đang xử lý...</span>
                        </>
                    ) : (
                        <>
                            <span>Đăng nhập</span>
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </form>

            {/* Divider */}
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

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300">
                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                    Facebook
                </button>
            </div>

            {/* Register Link */}
            <div className="mt-4 text-center text-xs text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                    to="/auth?mode=register"
                    className="font-bold text-[#ee4d2d] hover:text-[#d04126] hover:underline"
                >
                    Đăng ký miễn phí
                </Link>
            </div>
        </div>
    );
}