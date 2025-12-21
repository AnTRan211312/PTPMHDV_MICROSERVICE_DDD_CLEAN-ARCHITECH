import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type {
    SelfUserUpdateProfileRequest,
    UserDetailsResponse,
} from "@/types/user.d.ts";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileEditFormProps {
    userDetails: UserDetailsResponse;
    onSubmit: (data: SelfUserUpdateProfileRequest) => void;
    isLoading?: boolean;
}

const ProfileEditForm = ({
    userDetails,
    onSubmit,
    isLoading = false,
}: ProfileEditFormProps) => {
    const [formData, setFormData] = useState<SelfUserUpdateProfileRequest>({
        name: userDetails.name || "",
        email: userDetails.email || "",
        phoneNumber: userDetails.phoneNumber || "",
        dateBirth: userDetails.dob ? userDetails.dob.split("T")[0] : "",
        address: userDetails.address || "",
        gender: (userDetails.gender as "MALE" | "FEMALE" | "OTHER") || "OTHER",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate số điện thoại
        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            toast.error("Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng 0)");
            return;
        }

        onSubmit(formData);
    };

    const handleInputChange = (
        field: keyof SelfUserUpdateProfileRequest,
        value: string
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Hàm sanitize địa chỉ
    const sanitizeAddress = (text: string): string => {
        return text
            .replace(/\s+,/g, ',')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleAddressBlur = () => {
        if (formData.address) {
            const sanitized = sanitizeAddress(formData.address);
            setFormData((prev) => ({ ...prev, address: sanitized }));
        }
    };

    return (
        <div className="animate-in fade-in zoom-in duration-300 py-2">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* Username */}
                <div className="grid grid-cols-12 gap-4 items-center">
                    <Label className="col-span-3 text-right text-gray-500 font-normal">
                        Tên đăng nhập
                    </Label>
                    <div className="col-span-9 font-medium text-gray-900">
                        {(userDetails as any).username || userDetails.email?.split('@')[0] || "admin"}
                    </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-12 gap-4 items-center">
                    <Label htmlFor="name" className="col-span-3 text-right text-gray-500 font-normal">
                        Tên
                    </Label>
                    <div className="col-span-9">
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="h-10"
                            placeholder="Nhập tên của bạn"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="grid grid-cols-12 gap-4 items-center">
                    <Label className="col-span-3 text-right text-gray-500 font-normal">
                        Email
                    </Label>
                    <div className="col-span-9 flex items-center gap-2 text-gray-900">
                        {userDetails.email}
                        <button
                            type="button"
                            onClick={() => toast.info("Vui lòng liên hệ Admin để thay đổi Email")}
                            className="text-orange-500 underline text-sm hover:text-orange-600 ml-2"
                        >
                            Thay đổi
                        </button>
                    </div>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-12 gap-4 items-center">
                    <Label className="col-span-3 text-right text-gray-500 font-normal">
                        Số điện thoại
                    </Label>
                    <div className="col-span-9 flex items-center gap-2 text-gray-900">
                        {userDetails.phoneNumber ? (
                            <span>********{userDetails.phoneNumber.slice(-2)}</span>
                        ) : (
                            <span className="text-gray-400 italic">Chưa cập nhật</span>
                        )}
                        <button
                            type="button"
                            onClick={() => toast.info("Vui lòng liên hệ Admin để thay đổi Số điện thoại")}
                            className="text-orange-500 underline text-sm hover:text-orange-600 ml-2"
                        >
                            Thay đổi
                        </button>
                    </div>
                </div>

                {/* Gender */}
                <div className="grid grid-cols-12 gap-4 items-center">
                    <Label className="col-span-3 text-right text-gray-500 font-normal">
                        Giới tính
                    </Label>
                    <div className="col-span-9">
                        <RadioGroup
                            value={formData.gender}
                            onValueChange={(val) => handleInputChange("gender", val)}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="MALE" id="r-male" className="text-orange-600 border-gray-400" />
                                <Label htmlFor="r-male" className="font-normal cursor-pointer">Nam</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="FEMALE" id="r-female" className="text-orange-600 border-gray-400" />
                                <Label htmlFor="r-female" className="font-normal cursor-pointer">Nữ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="OTHER" id="r-other" className="text-orange-600 border-gray-400" />
                                <Label htmlFor="r-other" className="font-normal cursor-pointer">Khác</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                {/* DOB */}
                <div className="grid grid-cols-12 gap-4 items-center">
                    <Label className="col-span-3 text-right text-gray-500 font-normal">
                        Ngày sinh
                    </Label>
                    <div className="col-span-9">
                        <Input
                            id="dateBirth"
                            type="date"
                            value={formData.dateBirth}
                            onChange={(e) => handleInputChange("dateBirth", e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="h-10 w-48"
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-12 gap-4 items-start">
                    <Label htmlFor="address" className="col-span-3 text-right text-gray-500 font-normal mt-2">
                        Địa chỉ
                    </Label>
                    <div className="col-span-9">
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            onBlur={handleAddressBlur}
                            placeholder="Nhập địa chỉ của bạn"
                            rows={2}
                            className="bg-white resize-none"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="grid grid-cols-12 gap-4 mt-8">
                    <div className="col-span-3"></div>
                    <div className="col-span-9">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white min-w-[100px] h-10"
                        >
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Đang lưu..
                                </>
                            ) : (
                                "Lưu"
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditForm;