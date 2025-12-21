import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SelfUserUpdatePasswordRequest } from "@/types/user.d.ts";
import { Eye, EyeOff, Lock, Check, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PasswordChangeFormProps {
    onSubmit: (data: SelfUserUpdatePasswordRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

interface FormData extends SelfUserUpdatePasswordRequest {
    confirmPassword: string;
}

const PasswordChangeForm = ({
    onSubmit,
    isLoading = false,
}: PasswordChangeFormProps) => {
    const [formData, setFormData] = useState<FormData>({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const isPasswordValid = formData.newPassword.length >= 6;
    const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không trùng khớp");
            return;
        }

        const requestData: SelfUserUpdatePasswordRequest = {
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword,
        };
        onSubmit(requestData);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleForgotPassword = () => {
        toast.info("Vui lòng đăng xuất và sử dụng chức năng 'Quên mật khẩu' ở màn hình đăng nhập");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto py-2">
            {/* Current Password */}
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 text-right">
                    <Label htmlFor="oldPassword" className="text-gray-500 font-normal">
                        Mật khẩu hiện tại
                    </Label>
                </div>
                <div className="col-span-8">
                    <div className="relative group max-w-md">
                        <Input
                            id="oldPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={formData.oldPassword}
                            onChange={(e) => handleInputChange("oldPassword", e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại"
                            required
                            autoComplete="current-password"
                            className="h-10 border-gray-300 focus:border-orange-500 pr-10 bg-white placeholder:text-gray-400"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                            onClick={() => togglePasswordVisibility("current")}
                        >
                            {showPasswords.current ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <div className="mt-1.5 ">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                        >
                            <HelpCircle className="h-3 w-3" />
                            Quên mật khẩu?
                        </button>
                    </div>
                </div>
            </div>

            {/* New Password */}
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 text-right">
                    <Label htmlFor="newPassword" className="text-gray-500 font-normal">
                        Mật khẩu mới
                    </Label>
                </div>
                <div className="col-span-8">
                    <div className="relative group max-w-md">
                        <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange("newPassword", e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                            required
                            autoComplete="new-password"
                            className="h-10 border-gray-300 focus:border-orange-500 pr-10 bg-white placeholder:text-gray-400"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                            onClick={() => togglePasswordVisibility("new")}
                        >
                            {showPasswords.new ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {/* Helper text immediately below input */}
                    {formData.newPassword && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs transition-all">
                            {isPasswordValid ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                                <span className="text-gray-400 w-3.5 h-3.5 flex items-center justify-center text-[10px] border border-gray-400 rounded-full">i</span>
                            )}
                            <span className={isPasswordValid ? "text-green-600" : "text-gray-500"}>
                                Ít nhất 6 ký tự
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Password */}
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 text-right">
                    <Label htmlFor="confirmPassword" className="text-gray-500 font-normal">
                        Xác nhận mật khẩu
                    </Label>
                </div>
                <div className="col-span-8">
                    <div className="relative group max-w-md">
                        <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            required
                            autoComplete="new-password"
                            className={`h-10 border-gray-300 focus:border-orange-500 pr-10 bg-white placeholder:text-gray-400 ${formData.confirmPassword && !passwordsMatch ? "border-red-300 focus:border-red-400" : ""
                                }`}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                            onClick={() => togglePasswordVisibility("confirm")}
                        >
                            {showPasswords.confirm ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {formData.confirmPassword && !passwordsMatch && (
                        <div className="mt-1.5 text-xs text-red-500">
                            Mật khẩu không khớp
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <div className="grid grid-cols-12 gap-4 mt-8">
                <div className="col-span-4"></div>
                <div className="col-span-8">
                    <Button
                        type="submit"
                        disabled={isLoading || !isPasswordValid || !passwordsMatch || !formData.oldPassword}
                        className="bg-orange-500 hover:bg-orange-600 text-white min-w-[120px] h-10 shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Lưu
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default PasswordChangeForm;