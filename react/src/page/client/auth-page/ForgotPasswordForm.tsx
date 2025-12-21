import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    forgotPassword,
    resendOtp,
    verifyOtp,
} from "@/services/authApi";
import {
    ArrowLeft,
    Loader2,
    Mail,
    ShieldCheck,
    Clock,
    RotateCcw,
    LockKeyhole,
    CheckCircle2,
    ChevronRight,
    AlertCircle
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";

type Step = "forgot" | "verify";

export default function ForgotPasswordForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("forgot");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [otpExpiresIn, setOtpExpiresIn] = useState<number | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

    // Email validation
    const validateEmail = (email: string): boolean => {
        const regex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
        return regex.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        if (value && !validateEmail(value)) {
            setEmailError("Email không hợp lệ");
        } else {
            setEmailError("");
        }
    };

    // Bước 1: Gửi OTP
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setEmailError("Vui lòng nhập email");
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Email không hợp lệ");
            return;
        }

        try {
            setIsLoading(true);
            const response = await forgotPassword({ email });
            const data = response.data.data;
            setOtpExpiresIn(data.expiresIn);
            setRemainingAttempts(data.remainingAttempts);

            // Generic message - không confirm email có tồn tại hay không (security best practice)
            toast.success("Nếu email này tồn tại trong hệ thống, mã OTP sẽ được gửi đến hộp thư của bạn");
            setStep("verify");
        } catch (error) {
            // Generic error message - không tiết lộ thông tin về email
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau");
        } finally {
            setIsLoading(false);
        }
    };

    // Gửi lại OTP
    const handleResendOtp = async () => {
        try {
            setIsLoading(true);
            const response = await resendOtp({ email });
            const data = response.data.data;
            setOtpExpiresIn(data.expiresIn);
            setRemainingAttempts(data.remainingAttempts);
            toast.success("Đã gửi lại mã OTP");
        } catch (error) {
            toast.error("Không thể gửi lại mã OTP. Vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 2: Xác thực OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error("Mã OTP phải có 6 ký tự");
            return;
        }

        try {
            setIsLoading(true);
            console.log("🔐 Verifying OTP:", { email, otp });

            const response = await verifyOtp({ email, otp });

            // Parse response - backend trả về { success, message, data: { valid, message } }
            const apiData = response.data;
            const verifyData = apiData?.data || apiData;

            // Backend trả về field 'valid' (boolean)
            const isOtpValid = verifyData?.valid === true;

            if (isOtpValid) {
                toast.success("Xác thực OTP thành công!");

                // Chuyển hướng ngay lập tức
                navigate("/reset-password", {
                    state: {
                        email,
                        otp,
                    },
                });
            } else {
                const errorMsg = verifyData?.message || "Mã OTP không hợp lệ";
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error("💥 Verify OTP Error:", error);
            if (isAxiosError(error)) {
                const errorMsg = error.response?.data?.message || "Mã OTP không hợp lệ. Vui lòng thử lại";
                console.error("❌ Axios Error:", error.response?.data);
                toast.error(errorMsg);
            } else {
                console.error("❌ Unknown Error:", error);
                toast.error("Đã xảy ra lỗi không mong muốn.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number | null) => {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Countdown timer
    useEffect(() => {
        if (otpExpiresIn !== null && otpExpiresIn > 0 && step === "verify") {
            const timer = setInterval(() => {
                setOtpExpiresIn((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [otpExpiresIn, step]);

    const isFormValid = email && !emailError;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6633] to-[#ee4d2d] text-white shadow-lg shadow-orange-200">
                    <LockKeyhole className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
                    Khôi phục tài khoản
                </h2>
                <p className="mt-2 text-xs text-gray-600">
                    {step === "forgot"
                        ? "Nhập email để nhận mã xác thực"
                        : "Nhập mã OTP đã được gửi đến email của bạn"}
                </p>
            </div>

            <div className="p-0">
                {/* --- BƯỚC 1: NHẬP EMAIL --- */}
                {step === "forgot" && (
                    <form onSubmit={handleForgotPassword} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                Email đăng ký
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nhap_email_cua_ban@gmail.com"
                                    value={email}
                                    onChange={handleEmailChange}
                                    disabled={isLoading}
                                    required
                                    className={`h-12 pl-10 ${emailError && email
                                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                                        : "border-gray-200 focus:border-[#ee4d2d] focus:ring-[#ee4d2d]/10"
                                        } bg-gray-50 text-gray-900 transition-all focus:bg-white focus:ring-4 rounded-xl`}
                                />
                            </div>
                            {emailError && email && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {emailError}
                                </p>
                            )}
                        </div>

                        {/* Security Notice */}
                        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-[#ee4d2d] flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-gray-700">
                                    <p className="font-semibold text-gray-900 mb-1">Bảo mật thông tin</p>
                                    <p>Chúng tôi sẽ gửi mã xác thực đến email của bạn. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className="w-full h-12 rounded-xl bg-[#ee4d2d] text-white hover:bg-[#d04126] hover:shadow-lg hover:shadow-[#ee4d2d]/20 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    Gửi mã xác thực
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                )}

                {/* --- BƯỚC 2: XÁC THỰC OTP (Hiển thị ngay tại chỗ, không redirect) --- */}
                {step === "verify" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-center">
                            <p className="text-sm text-gray-700">
                                Mã OTP đã được gửi đến
                            </p>
                            <p className="mt-1 font-semibold text-[#ee4d2d] text-base truncate px-2">
                                {email}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="otp" className="text-sm font-semibold text-gray-700 flex justify-between">
                                <span>Nhập mã OTP</span>
                                <span className="text-xs text-gray-500 font-normal">6 chữ số</span>
                            </Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    disabled={isLoading}
                                    maxLength={6}
                                    required
                                    className="h-14 pl-10 text-center text-2xl font-bold tracking-[0.5em] border-gray-200 bg-white text-gray-900 transition-all focus:border-[#ee4d2d] focus:ring-4 focus:ring-[#ee4d2d]/10 rounded-xl placeholder:tracking-widest placeholder:text-gray-300"
                                />
                            </div>

                            {/* Thông tin thời gian và số lần thử */}
                            <div className="flex items-center justify-between text-sm pt-2">
                                <div className={`flex items-center gap-1.5 transition-colors ${otpExpiresIn !== null && otpExpiresIn < 30 ? "text-red-500" : "text-gray-500"}`}>
                                    <Clock className="h-4 w-4" />
                                    <span>Hết hạn: </span>
                                    <span className="font-medium font-mono">
                                        {formatTime(otpExpiresIn)}
                                    </span>
                                </div>
                                {remainingAttempts !== null && (
                                    <div className="text-gray-500">
                                        Còn lại: <span className="font-medium text-gray-900">{remainingAttempts} lần</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResendOtp}
                                disabled={isLoading || (otpExpiresIn !== null && otpExpiresIn > 0)}
                                className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#ee4d2d] hover:border-orange-200 transition-all disabled:opacity-50"
                            >
                                <RotateCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Gửi lại
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="flex-1 h-12 rounded-xl bg-[#ee4d2d] text-white hover:bg-[#d04126] hover:shadow-lg hover:shadow-[#ee4d2d]/20 transition-all duration-200 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Xác thực
                                    </>
                                )}
                            </Button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                // Chỉ reset OTP input, GIỮ LẠI email và thời gian hết hạn
                                setStep("forgot");
                                setOtp("");
                                // KHÔNG reset otpExpiresIn và remainingAttempts
                            }}
                            className="w-full text-center text-sm text-gray-500 hover:text-[#ee4d2d] transition-colors flex items-center justify-center gap-1 py-1"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Nhập lại email
                        </button>
                    </form>
                )}
            </div>

            {/* Footer - Đơn giản, không dư thừa */}
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                    Đã nhớ mật khẩu?{" "}
                    <Link
                        to="/auth?mode=login"
                        className="font-semibold text-[#ee4d2d] hover:text-[#d04126] hover:underline transition-all"
                    >
                        Đăng nhập ngay
                    </Link>
                </p>
            </div>

            {/* Trust Badge - Đơn giản */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                    Mã hóa SSL 256-bit
                </p>
            </div>
        </div>
    );
}