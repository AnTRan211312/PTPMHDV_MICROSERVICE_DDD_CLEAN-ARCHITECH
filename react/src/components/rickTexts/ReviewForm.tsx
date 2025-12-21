import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Star } from "lucide-react";
import { useState } from "react";
import type { CreateReviewRequest, ReviewResponse } from "@/types/review.d.ts";

const reviewSchema = z.object({
    rating: z.number().min(1, "Vui lòng chọn đánh giá").max(5),
    comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
    productId: number;
    existingReview?: ReviewResponse;
    onSuccess?: () => void;
    onCancel?: () => void;
    onSubmit: (data: CreateReviewRequest) => Promise<void>;
    isLoading?: boolean;
}

export function ReviewForm({
    existingReview,
    onSuccess,
    onCancel,
    onSubmit,
    isLoading
}: ReviewFormProps) {
    const [hoveredRating, setHoveredRating] = useState(0);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: existingReview?.rating || 0,
            comment: existingReview?.comment || "",
        },
    });

    const rating = form.watch("rating");

    const handleSubmit = async (data: ReviewFormValues) => {
        await onSubmit(data);
        onSuccess?.();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-white p-6 rounded-lg border">
                <h4 className="font-semibold text-lg">
                    {existingReview ? "Chỉnh sửa đánh giá" : "Viết đánh giá"}
                </h4>

                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Đánh giá của bạn *</FormLabel>
                            <FormControl>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-8 h-8 cursor-pointer transition ${star <= (hoveredRating || rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                }`}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            onClick={() => field.onChange(star)}
                                        />
                                    ))}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nhận xét (Tùy chọn)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                    rows={4}
                                    maxLength={500}
                                    {...field}
                                />
                            </FormControl>
                            <p className="text-xs text-gray-500">
                                {field.value?.length || 0}/500 ký tự
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isLoading ? "Đang gửi..." : existingReview ? "Cập nhật" : "Gửi đánh giá"}
                    </Button>
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    );
}
