import { useAppSelector } from "@/features/hooks";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

const AuthPage = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const mode = params.get("mode");

    const loginRef = useRef<HTMLDivElement | null>(null);
    const registerRef = useRef<HTMLDivElement | null>(null);
    const forgotPasswordRef = useRef<HTMLDivElement | null>(null);

    // --- LOGIC GIỮ NGUYÊN ---
    useEffect(() => {
        // Redirect về login nếu mode không hợp lệ
        if (mode !== "login" && mode !== "register" && mode !== "forgot-password") {
            navigate("/auth?mode=login");
        }
    }, [mode, navigate]);

    const isLogin = useAppSelector((state) => state.auth.isLogin);

    // Redirect về Home nếu đã đăng nhập
    useEffect(() => {
        if (isLogin) {
            navigate("/", { replace: true });
        }
    }, [isLogin, navigate]);

    // Scroll effect khi chuyển mode
    useEffect(() => {
        if (mode === "login" && loginRef.current) {
            loginRef.current.scrollIntoView({ behavior: "smooth" });
        }
        if (mode === "register" && registerRef.current) {
            registerRef.current.scrollIntoView({ behavior: "smooth" });
        }
        if (mode === "forgot-password" && forgotPasswordRef.current) {
            forgotPasswordRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [mode]);

    // --- GIAO DIỆN ĐƯỢC ĐỒNG BỘ ---
    return (
        <div className="flex min-h-screen w-full items-center justify-center font-sans bg-gray-50 p-4 lg:p-8">
            <div className="flex w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-gray-200/50 ring-1 ring-gray-900/5 min-h-[700px]">
                {/* Left Side - Hero Image & Branding */}
                <div className="hidden lg:flex w-1/2 relative bg-gray-900 justify-center items-center overflow-hidden">
                    <div
                        className="absolute inset-0 z-0 opacity-40"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div className="relative z-10 px-12 text-center text-white">
                        <h2 className="mb-6 text-5xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                            Khám phá phong cách <br />
                            <span className="text-blue-400">của riêng bạn.</span>
                        </h2>
                        <p className="text-lg text-gray-200 max-w-md mx-auto leading-relaxed drop-shadow-md">
                            Tham gia cộng đồng mua sắm trực tuyến hàng đầu. Hàng ngàn sản phẩm chất lượng đang chờ đón bạn.
                        </p>
                    </div>
                    {/* Overlay gradient for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-0" />
                </div>

                {/* Right Side - Forms */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white relative">
                    <div className="w-full max-w-[400px]">

                        {/* Login Mode */}
                        {mode === "login" && (
                            <div ref={loginRef} className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                                <LoginForm />
                            </div>
                        )}

                        {/* Register Mode */}
                        {mode === "register" && (
                            <div ref={registerRef} className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                                <RegisterForm />
                            </div>
                        )}

                        {/* Forgot Password Mode */}
                        {mode === "forgot-password" && (
                            <div ref={forgotPasswordRef} className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                                <ForgotPasswordForm />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;