import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Eye, EyeOff, Save, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { UserCreateRequest, UserUpdateRequest, RoleIdDto, RoleInformationDto } from "@/types/user";
import { getErrorMessage } from "@/features/slices/authThunk";
import { toast } from "sonner";
import { getUserById, saveUser, updateUser } from "@/services/userApi";
import RoleSelection from "@/page/commons/RoleSelection.tsx";
import { useAppSelector } from "@/features/hooks.ts";

export default function UserUpsertPage() {
    const { permissions } = useAppSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        dob: "",
        address: "",
        gender: "OTHER" as "MALE" | "FEMALE" | "OTHER",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleInformationDto | undefined>();

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const res = await getUserById(parseInt(id));
                    const user = res.data.data;
                    setFormData({
                        name: user.name,
                        email: user.email,
                        password: "",
                        phoneNumber: user.phoneNumber || "",
                        dob: user.dob ? user.dob.split("T")[0] : "",
                        address: user.address || "",
                        gender: (user?.gender as "MALE" | "FEMALE" | "OTHER") || "OTHER",
                    });
                    setSelectedRole(user.role);
                } catch (err) {
                    toast.error(getErrorMessage(err, "Không tìm thấy người dùng này"));
                    setSearchParams({});
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [id, setSearchParams]);

    // Check permissions
    useEffect(() => {
        if (isEdit && !permissions?.includes("PUT /api/users")) {
            toast.error("Bạn không có quyền chỉnh sửa người dùng");
            navigate("/admin/users");
        } else if (!isEdit && !permissions?.includes("POST /api/users")) {
            toast.error("Bạn không có quyền thêm người dùng mới");
            navigate("/admin/users");
        }
    }, [isEdit, permissions, navigate]);

    const addRole = (role: RoleInformationDto) => {
        setSelectedRole(selectedRole?.id === role.id ? undefined : role);
    };

    const removeRole = () => setSelectedRole(undefined);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRole) {
            toast.error("Vui lòng chọn chức vụ cho người dùng");
            return;
        }

        setIsLoading(true);
        try {
            const roleIdData: RoleIdDto = { id: selectedRole.id };

            if (isEdit && id) {
                const updateData: UserUpdateRequest = {
                    id: Number(id),
                    name: formData.name,
                    gender: formData.gender,
                    birthdate: formData.dob,
                    address: formData.address,
                    phoneNumber: formData.phoneNumber,
                    role: roleIdData,
                };
                await updateUser(updateData);
            } else {
                const createData: UserCreateRequest = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber,
                    dateBirth: formData.dob,
                    address: formData.address,
                    gender: formData.gender,
                    role: roleIdData,
                };
                await saveUser(createData);
            }

            toast.success(isEdit ? "Cập nhật thành công" : "Tạo mới thành công");
            handleBack();
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleBack = () => navigate("/admin/users");

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Breadcrumb */}
            <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={handleBack} className="cursor-pointer hover:text-blue-600 transition-colors">
                            Quản lý người dùng
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-semibold text-slate-900">
                            {isEdit ? "Cập nhật thông tin" : "Thêm người dùng mới"}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Title Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBack}
                        className="h-10 w-10 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900"
                        title="Quay lại"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isEdit ? "Cập nhật thông tin chi tiết và quyền hạn." : "Điền thông tin để tạo tài khoản mới."}
                        </p>
                    </div>
                </div>
            </div>

            <form id="user-form" onSubmit={handleFormSubmit} className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-900">Thông tin người dùng</CardTitle>
                        <CardDescription>Điền thông tin chi tiết của người dùng vào biểu mẫu bên dưới</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Row 1: Name & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Họ và tên <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    required
                                    disabled={isEdit}
                                    placeholder="example@domain.com"
                                    className={`h-10 border-slate-200 ${isEdit ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                                />
                                {isEdit && <p className="text-xs text-slate-500">Email không thể thay đổi sau khi tạo.</p>}
                            </div>
                        </div>

                        {/* Row 2: Phone & DOB */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Số điện thoại <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                    required
                                    placeholder="Ví dụ: 0912345678"
                                    className="h-10 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Ngày sinh <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => handleInputChange("dob", e.target.value)}
                                    required
                                    className="h-10 border-slate-200 block w-full"
                                />
                            </div>
                        </div>

                        {/* Row 3: Address & Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Địa chỉ
                                </Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder="Nhập địa chỉ chi tiết..."
                                    className="h-10 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Giới tính
                                </Label>
                                <Select value={formData.gender} onValueChange={(v: any) => handleInputChange("gender", v)}>
                                    <SelectTrigger className="h-10 border-slate-200">
                                        <SelectValue placeholder="Chọn giới tính" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Nam</SelectItem>
                                        <SelectItem value="FEMALE">Nữ</SelectItem>
                                        <SelectItem value="OTHER">Khác</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Password Row (Only if !isEdit) */}
                        {!isEdit && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700">
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => handleInputChange("password", e.target.value)}
                                            required
                                            placeholder="Nhập mật khẩu..."
                                            className="h-10 border-slate-200 pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">Mật khẩu nên có ít nhất 6 ký tự, bao gồm chữ và số.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Role Selection */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Phân quyền
                        </CardTitle>
                        <CardDescription>Chọn vai trò và quyền hạn cho người dùng này</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <RoleSelection selectedRole={selectedRole} addRole={addRole} removeRole={removeRole} />
                    </CardContent>
                </Card>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 z-50 md:static md:bg-transparent md:border-0 md:justify-end md:p-0">
                    <Button variant="outline" type="button" onClick={handleBack} className="border-slate-300 text-slate-700">
                        Hủy bỏ
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    >
                        {isLoading ? (
                            "Đang xử lý..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
