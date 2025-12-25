import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    multiple?: boolean;
    onUpload: (files: File[]) => void;
    preview?: string[];
    maxSize?: number; // MB
    accept?: string;
}

export function ImageUpload({
    multiple = false,
    onUpload,
    preview = [],
    maxSize = 5,
    accept = "image/jpeg,image/png,image/webp"
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>(preview);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        validateAndPreview(files);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        validateAndPreview(files);
    };

    const validateAndPreview = (files: File[]) => {
        // Validate file types
        const validFiles = files.filter(file => {
            const isValidType = accept.split(',').some(type => file.type === type.trim());
            if (!isValidType) {
                toast.error(`File ${file.name} không hợp lệ. Chỉ chấp nhận: ${accept}`);
                return false;
            }
            // Validate file size
            const isValidSize = file.size <= maxSize * 1024 * 1024;
            if (!isValidSize) {
                toast.error(`File ${file.name} quá lớn. Kích thước tối đa: ${maxSize}MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Create previews
        const newPreviews: string[] = [];
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPreviews.push(e.target?.result as string);
                if (newPreviews.length === validFiles.length) {
                    if (multiple) {
                        setPreviews(prev => [...prev, ...newPreviews]);
                        setSelectedFiles(prev => [...prev, ...validFiles]);
                    } else {
                        setPreviews(newPreviews);
                        setSelectedFiles(validFiles);
                    }
                    onUpload(multiple ? [...selectedFiles, ...validFiles] : validFiles);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePreview = (index: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        onUpload(selectedFiles.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition"
            >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                    Kéo thả ảnh vào đây hoặc click để chọn
                </p>
                <p className="text-xs text-gray-500">
                    {multiple ? "Chọn nhiều ảnh" : "Chọn một ảnh"} • Tối đa {maxSize}MB
                </p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Preview Grid */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removePreview(index);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
