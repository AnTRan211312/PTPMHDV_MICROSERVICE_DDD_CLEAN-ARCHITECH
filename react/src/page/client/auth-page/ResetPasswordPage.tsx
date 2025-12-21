import { resetPassword } from "@/services/authApi";
import type { ResetPasswordRequest } from "@/types/auth";
import {
    ArrowLeft, Loader2, Lock, CheckCircle2,
    KeyRound, AlertCircle, ShieldCheck
} from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export default function ResetPasswordPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get email and OTP from location state
    const email = location.state?.email;
    const otp = location.state?.otp;

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // --- CASE 1: THIẾU THÔNG TIN (EMAIL/OTP) ---
    // Giao diện lỗi phiên làm việc
    if (!email || !otp) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
                <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-900/5 text-center p-10">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <AlertCircle size={40} />
                    </div>

                    <h2 className="mb-3 text-2xl font-bold text-gray-900">
                        Yêu cầu không hợp lệ
                    </h2>

                    <p className="mb-8 text-gray-500 leading-relaxed">
                        Phiên làm việc của bạn đã hết hạn hoặc đường dẫn không hợp lệ. Vui lòng thực hiện lại quy trình quên mật khẩu.
                    </p>

                    <Link
                        to="/auth?mode=forgot"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5"
                    >
                        <ArrowLeft size={18} />
                        Quay lại trang quên mật khẩu
                    </Link>
                </div>
            </div>
        );
    }

    // --- CASE 2: FORM ĐẶT LẠI MẬT KHẨU ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation Logic giữ nguyên
        if (!newPassword || !confirmPassword) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        try {
            setIsLoading(true);
            const request: ResetPasswordRequest = {
                email,
                otp,
                newPassword,
            };
            await resetPassword(request);
            toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
            // Delay chuyển trang để user đọc thông báo
            setTimeout(() => {
                navigate("/auth?mode=login");
            }, 2000);
        } catch (error) {
            if (isAxiosError(error)) {
                toast.error(
                    error.response?.data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại",
                );
            } else {
                console.error("An unexpected error occurred:", error);
                toast.error("Đã xảy ra lỗi không mong muốn.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
            {/* Card Container - Style giống RegisterForm */}
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-900/5">

                {/* Header Decoration */}
                <div className="bg-blue-600 px-8 py-10 text-center relative overflow-hidden">
                    {/* Background Pattern mờ */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                    <div className="relative z-10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Đặt lại mật khẩu</h1>
                        <p className="mt-2 text-blue-100 text-sm">
                            Hãy chọn một mật khẩu mạnh để bảo vệ tài khoản của bạn.
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    <form onSubmit={handleResetPassword} className="space-y-6">

                        {/* New Password Field */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <KeyRound size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                            {/* Helper Text */}
                            {newPassword.length > 0 && newPassword.length < 6 && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-red-500 animate-in fade-in">
                                    <AlertCircle size={12} /> Mật khẩu quá ngắn (tối thiểu 6 ký tự)
                                </p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-4 
                                        ${confirmPassword && confirmPassword === newPassword
                                        ? "border-green-500 bg-green-50 text-green-900 focus:ring-green-500/10"
                                        : "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10"
                                    }`}
                                />
                                {/* Success Indicator Icon */}
                                {confirmPassword && confirmPassword === newPassword && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-600">
                                        <CheckCircle2 size={18} />
                                    </div>
                                )}
                            </div>

                            {/* Validation Messages */}
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-red-500 animate-in fade-in">
                                    <AlertCircle size={12} /> Mật khẩu không khớp
                                </p>
                            )}
                            {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 6 && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600 animate-in fade-in">
                                    <CheckCircle2 size={12} /> Mật khẩu hợp lệ
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none disabled:hover:translate-y-0"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <>
                                    <span>Xác nhận đổi mật khẩu</span>
                                    <CheckCircle2 size={18} />
                                </>
                            )}
                        </button>

                        <div className="border-t border-gray-100 pt-6 text-center">
                            <Link
                                to="/auth?mode=login"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}