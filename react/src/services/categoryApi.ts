import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
    PageResponseDto,
    PaginationParams,
} from "@/types/apiResponse.d.ts";
import type {
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
} from "@/types/category.d.ts";

// PUBLIC - Không cần token
export const getCategories = ({ page = 0, size = 10, keyword = null }: Partial<PaginationParams> = {}) => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (keyword) params.append("keyword", keyword);

    return axiosClient.get<ApiResponse<PageResponseDto<CategoryResponse>>>(
        `/categories?${params.toString()}`
    );
};

// PUBLIC - Không cần token
export const getCategoryById = (id: number) => {
    return axiosClient.get<ApiResponse<CategoryResponse>>(
        `/categories/${id}`
    );
};

// ADMIN - Cần token
export const createCategory = (data: CreateCategoryRequest) => {
    return axiosClient.post<ApiResponse<CategoryResponse>>(
        "/categories",
        data
    );
};

// ADMIN - Cần token
export const updateCategory = (id: number, data: UpdateCategoryRequest) => {
    return axiosClient.put<ApiResponse<CategoryResponse>>(
        `/categories/${id}`,
        data
    );
};

// ADMIN - Cần token
export const deleteCategory = (id: number) => {
    return axiosClient.delete<ApiResponse<void>>(
        `/categories/${id}`
    );
};
