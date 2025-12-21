import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category.d.ts";

const categorySchema = z.object({
    name: z.string().min(1, "Tên danh mục là bắt buộc"),
    description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category?: CategoryResponse;
    onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name || "",
            description: category?.description || "",
        },
    });

    const handleSubmit = async (data: CategoryFormValues) => {
        if (category) {
            await onSubmit({ id: category.id, ...data } as UpdateCategoryRequest);
        } else {
            await onSubmit(data as CreateCategoryRequest);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold">
                    {category ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
                </h3>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên danh mục *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên danh mục" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Nhập mô tả danh mục"
                                    rows={4}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                        {isLoading ? "Đang lưu..." : category ? "Cập nhật" : "Tạo mới"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Hủy
                    </Button>
                </div>
            </form>
        </Form>
    );
}
