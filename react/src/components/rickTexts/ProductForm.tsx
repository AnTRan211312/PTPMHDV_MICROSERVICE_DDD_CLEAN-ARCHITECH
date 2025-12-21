import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Upload, ImageIcon, Trash, Plus } from "lucide-react";
import type { ProductResponse } from "@/types/product";
import type { CategoryResponse } from "@/types/category";
import { getCategories } from "@/services/categoryApi";
import { toast } from "sonner";

const productSchema = z.object({
    name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
    description: z.string().min(1, "Mô tả là bắt buộc"),
    price: z.coerce.number().min(0, "Giá phải >= 0"),
    discountPrice: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.coerce.number().min(0, "Giá khuyến mãi phải >= 0").optional()
    ).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: ProductResponse | null;
    onSubmit: (data: FormData, id?: number) => Promise<void>;
}

export default function ProductForm({
    open,
    onOpenChange,
    initialData,
    onSubmit,
}: ProductFormProps) {
    const isEdit = !!initialData;
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

    // Thumbnail
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

    // Gallery Images
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            discountPrice: undefined,
        },
    });

    useEffect(() => {
        if (open) {
            void fetchCategories();
            if (initialData) {
                reset({
                    name: initialData.name,
                    description: initialData.description,
                    price: initialData.price,
                    discountPrice: initialData.discountPrice ?? undefined,
                });
                setSelectedCategories(initialData.categories?.map((c) => c.id) || []);
                setThumbnailPreview(initialData.thumbnail || "");
                setExistingImages(initialData.images || []);
            } else {
                reset({ name: "", description: "", price: 0, discountPrice: undefined });
                setSelectedCategories([]);
                setThumbnailPreview("");
                setThumbnailFile(null);
                setExistingImages([]);
            }
            // Always reset new files on open
            setGalleryFiles([]);
            setGalleryPreviews([]);
        }
    }, [open, initialData, reset]);

    const fetchCategories = async () => {
        try {
            const res = (await getCategories({ page: 0, size: 100 })).data.data;
            if (res) setCategories(res.content);
        } catch {
            toast.error("Không thể tải danh mục");
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesFn = Array.from(e.target.files);

            // Backend limit is 5 images total. 
            // Since replacing, we just check if new files > 5.
            if (filesFn.length > 5) {
                toast.error("Tối đa 5 ảnh chi tiết");
                return;
            }

            setGalleryFiles(filesFn); // Replace current selection completely or append? Let's replace for simplicity or append?
            // User might want to append. But if backend replaces all, we should collect all desired new files.
            // Let's assume user selects all needed files at once or we manage a list. 
            // Managing a list to append:

            const totalFiles = existingImages.length + galleryFiles.length + filesFn.length;
            if (totalFiles > 5) {
                toast.error(`Tổng số ảnh không được vượt quá 5. Hiện tại chỉ có thể thêm ${5 - (existingImages.length + galleryFiles.length)} ảnh.`);
                return;
            }

            const newFiles = [...galleryFiles, ...filesFn];
            setGalleryFiles(newFiles);

            const newUrls = filesFn.map(file => URL.createObjectURL(file));
            setGalleryPreviews(prev => [...prev, ...newUrls]);
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCategory = (id: number) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleFormSubmit = async (data: ProductFormData) => {
        setIsLoading(true);
        try {
            const formData = new FormData();

            // Create product JSON object
            const productData = {
                name: data.name,
                description: data.description,
                price: Number(data.price),
                discountPrice: data.discountPrice !== undefined && data.discountPrice !== null ? Number(data.discountPrice) : null,
                categoryIds: selectedCategories,
                keptImages: existingImages, // Send remaining existing images to backend
            };

            // Append as "product" part (required by backend)
            formData.append("product", new Blob([JSON.stringify(productData)], { type: "application/json" }));

            // Append files
            if (thumbnailFile) {
                formData.append("thumbnail", thumbnailFile);
            }

            // Append gallery images
            if (galleryFiles.length > 0) {
                galleryFiles.forEach(file => {
                    formData.append("images", file);
                });
            }

            await onSubmit(formData, initialData?.id);

            // Only close dialog after CREATE, not UPDATE
            if (!initialData?.id) {
                onOpenChange(false);
            }
            // After update, user can manually close or click "Back to list" button
        } catch (error) {
            console.error(error);
            // toast handled in parent or interceptor
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Thumbnail */}
                    <div className="space-y-3">
                        <Label>Ảnh đại diện</Label>
                        <div className="flex items-center gap-4">
                            {thumbnailPreview ? (
                                <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-gray-50">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleThumbnailChange}
                                />
                                <Button type="button" variant="outline" size="sm" className="gap-2 pointer-events-none" asChild>
                                    <span>
                                        <Upload className="h-4 w-4" />
                                        Thay đổi
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </div>

                    {/* Gallery Images */}
                    <div className="space-y-3">
                        <Label>Ảnh chi tiết (Tối đa 5 ảnh)</Label>


                        <div className="grid grid-cols-5 gap-3">
                            {/* Existing Images (Display only if no new files, or display logic could be tricky. 
                                Backend replaces all. So if user adds 1 new, old ones are gone.
                                UX: Show old ones. If new ones added, mark old ones as 'Will be removed' or just hide them?
                                Let's simply show old ones until new ones are added? No, user might want to KEEP old ones + add new.
                                Since backend does NOT support append, we can't easily keep old ones unless we download and re-upload them (complex).
                                Simply show New Images List. If empty, show Old Images List.
                            */}

                            {/* Existing Images */}
                            {existingImages.map((img, idx) => (
                                <div key={`old-${idx}`} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group">
                                    <img src={img} alt={`Old ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(idx)}
                                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 transition-all shadow-sm"
                                        title="Xóa ảnh này"
                                    >
                                        <Trash className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {/* New Images Previews */}
                            {galleryPreviews.map((preview, idx) => (
                                <div key={`new-${idx}`} className="relative aspect-square rounded-md overflow-hidden border border-blue-200 ring-2 ring-blue-100">
                                    <img src={preview} alt={`New ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(idx)}
                                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-red-100 text-red-600 transition-colors"
                                    >
                                        <Trash className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {/* Add Button */}
                            {/* Add Button */}
                            {(existingImages.length + galleryFiles.length < 5) && (
                                <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
                                    <Plus className="w-6 h-6 text-gray-400" />
                                    <span className="text-[10px] text-gray-500 mt-1">Thêm ảnh</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleGalleryChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label>Tên sản phẩm *</Label>
                        <Input {...register("name")} placeholder="Nhập tên sản phẩm" />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Mô tả *</Label>
                        <Textarea
                            {...register("description")}
                            placeholder="Nhập mô tả sản phẩm"
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Giá gốc *</Label>
                            <Input
                                type="number"
                                {...register("price")} // removed valueAsNumber
                                placeholder="0"
                            />
                            {errors.price && (
                                <p className="text-sm text-red-500">{errors.price.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Giá khuyến mãi (Tùy chọn)</Label>
                            <Input
                                type="number"
                                {...register("discountPrice")} // removed valueAsNumber, handled by Zod
                                placeholder="Nhập giá khuyến mãi (nếu có)"
                            />
                            {errors.discountPrice && (
                                <p className="text-sm text-red-500">{errors.discountPrice.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <Label>Danh mục (Chọn nhiều)</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50 max-h-[150px] overflow-y-auto">
                            {categories.map((cat) => (
                                <Badge
                                    key={cat.id}
                                    variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                                    className={`cursor-pointer select-none transition-all ${selectedCategories.includes(cat.id) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-100 hover:border-blue-400'}`}
                                    onClick={() => toggleCategory(cat.id)}
                                >
                                    {cat.name}
                                    {selectedCategories.includes(cat.id) && (
                                        <X className="ml-1 h-3 w-3" />
                                    )}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 text-right">Đã chọn: {selectedCategories.length}</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? "Đang xử lý..." : isEdit ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
