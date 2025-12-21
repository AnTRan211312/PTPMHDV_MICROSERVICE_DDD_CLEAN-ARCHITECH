import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/features/hooks";
import {
    getAccount,
    getErrorMessage,
} from "@/features/slices/authThunk";
import { getUserDetails } from "@/services/authApi";
import {
    selfUserAvatarUpdateApi,
    selfUserPasswordUpdateApi,
    selfUserProfileUpdateApi,
} from "@/services/userApi";

import type {
    SelfUserUpdatePasswordRequest,
    SelfUserUpdateProfileRequest,
    UserDetailsResponse,
} from "@/types/user.d.ts";

import {
    Lock,
    User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AvatarUploadForm from "./AvatarUploadForm";
import PasswordChangeForm from "./PasswordChangeForm";
import ProfileEditForm from "./ProfileEditForm";

const UserInfoPage = () => {
    const dispatch = useAppDispatch();

    const [userDetails, setUserDetails] = useState<UserDetailsResponse>();
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());

    // UI States
    const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
    // We removed separate ProfileEditForm toggle because ProfileEditForm is now the main view
    const [isOpenAvatarUploadForm, setIsOpenAvatarUploadForm] = useState(false);

    // ======================================
    // Fetch Data
    // ======================================
    const fetchUserDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getUserDetails();
            setUserDetails(res.data.data);
            setAvatarVersion(Date.now());
        } catch (err) {
            toast.error(
                getErrorMessage(err, "Không thể lấy thông tin chi tiết người dùng")
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    // ======================================
    // Actions
    // ======================================
    const handleUpdateProfile = async (data: SelfUserUpdateProfileRequest) => {
        try {
            setIsUpdating(true);
            await selfUserProfileUpdateApi(data);
            await fetchUserDetails();
            dispatch(getAccount());
            toast.success("Cập nhật thông tin thành công");
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePassword = async (data: SelfUserUpdatePasswordRequest) => {
        try {
            setIsUpdating(true);
            await selfUserPasswordUpdateApi(data);
            await fetchUserDetails();
            toast.success("Cập nhật mật khẩu thành công");
            setActiveTab("profile");
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarUpload = async (avatarFile: File) => {
        try {
            setIsUpdating(true);
            const data = new FormData();
            if (avatarFile) data.append("avatar", avatarFile);
            else {
                toast.error("File ảnh không được trống");
                return;
            }
            await selfUserAvatarUpdateApi(data);
            await fetchUserDetails();
            dispatch(getAccount());
            setAvatarVersion(Date.now());
            toast.success("Cập nhật ảnh đại diện thành công");
            setIsOpenAvatarUploadForm(false);
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsUpdating(false);
        }
    };

    // ===================
    // Helpers
    // ===================
    const getUserInitials = (name: string) => {
        if (!name) return "U";
        return name.split(" ").map((word) => word.charAt(0)).join("").toUpperCase().slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Skeleton className="h-64 md:col-span-1 rounded-xl" />
                        <Skeleton className="h-96 md:col-span-3 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!userDetails) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <Button onClick={fetchUserDetails}>Thử lại</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* LEFT SIDEBAR */}
                <div className="md:col-span-3 lg:col-span-3 space-y-4">
                    {/* User Brief */}
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <Avatar className="h-12 w-12 border border-gray-200">
                            <AvatarImage
                                src={userDetails.logoUrl ? `${userDetails.logoUrl}?v=${avatarVersion}` : ""}
                                alt={userDetails.name}
                            />
                            <AvatarFallback className="bg-orange-500 text-white font-bold">
                                {getUserInitials(userDetails.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-gray-900 truncate">{userDetails.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-gray-500 text-sm flex items-center gap-1 cursor-pointer hover:text-orange-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    Sửa hồ sơ
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Menu Navigation */}
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg ${activeTab === "profile" ? "text-orange-600 bg-orange-50" : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"}`}
                        >
                            <User className="h-5 w-5" />
                            <span>Hồ sơ của tôi</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg ${activeTab === "password" ? "text-orange-600 bg-orange-50" : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"}`}
                        >
                            <Lock className="h-5 w-5" />
                            <span>Đổi mật khẩu</span>
                        </button>
                    </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="md:col-span-9 lg:col-span-9">
                    <Card className="border-none shadow-sm bg-white min-h-[500px]">
                        <CardContent className="p-8">
                            {/* TAB: PROFILE */}
                            {activeTab === "profile" && (
                                <div className="space-y-0 animate-in fade-in duration-300">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-xl font-medium text-gray-900">Hồ sơ của tôi</h2>
                                        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                                    </div>

                                    <div className="flex flex-col-reverse md:flex-row gap-8">
                                        {/* Left Side: Form */}
                                        <div className="flex-1 border-r border-gray-100 pr-8">
                                            <ProfileEditForm
                                                userDetails={userDetails}
                                                onSubmit={handleUpdateProfile}
                                                isLoading={isUpdating}
                                            />
                                        </div>

                                        {/* Right Side: Avatar */}
                                        <div className="md:w-[280px] flex flex-col items-center justify-start pt-4 gap-4">
                                            <Avatar className="h-28 w-28 border border-gray-200">
                                                <AvatarImage
                                                    src={userDetails.logoUrl ? `${userDetails.logoUrl}?v=${avatarVersion}` : ""}
                                                    alt={userDetails.name}
                                                />
                                                <AvatarFallback className="bg-orange-500 text-3xl font-bold text-white">
                                                    {getUserInitials(userDetails.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsOpenAvatarUploadForm(true)}
                                                className="border-gray-300 text-gray-600 hover:bg-gray-50"
                                            >
                                                Chọn ảnh
                                            </Button>
                                            <p className="text-xs text-gray-400 text-center px-4">
                                                Dụng lượng file tối đa 1 MB<br />
                                                Định dạng: .JPEG, .PNG
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: PASSWORD */}
                            {activeTab === "password" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-xl font-medium text-gray-900">Đổi mật khẩu</h2>
                                        <p className="text-sm text-gray-500 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
                                    </div>
                                    <div className="py-4">
                                        <PasswordChangeForm
                                            onSubmit={handleUpdatePassword}
                                            onCancel={() => { }}
                                            isLoading={isUpdating}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Avatar Upload Dialog - keep as Modal */}
            {isOpenAvatarUploadForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md">
                        <AvatarUploadForm
                            currentAvatarUrl={userDetails.logoUrl ? `${userDetails.logoUrl}?v=${avatarVersion}` : ""}
                            userName={userDetails.name}
                            onSubmit={handleAvatarUpload}
                            onCancel={() => setIsOpenAvatarUploadForm(false)}
                            isLoading={isUpdating}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInfoPage;