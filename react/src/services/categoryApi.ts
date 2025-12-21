import axiosClient from "@/lib/axiosClient";
import axios from "axios";
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

    return axios.get<ApiResponse<PageResponseDto<CategoryResponse>>>(
        `http://localhost:8080/api/categories?${params.toString()}`,
        { withCredentials: true }
    );
};

// PUBLIC - Không cần token
export const getCategoryById = (id: number) => {
    return axios.get<ApiResponse<CategoryResponse>>(
        `http://localhost:8080/api/categories/${id}`,
        { withCredentials: true }
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
