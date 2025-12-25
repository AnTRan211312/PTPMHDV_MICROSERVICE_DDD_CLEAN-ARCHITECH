import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
    PageResponseDto,
    PaginationParams,
} from "@/types/apiResponse.d.ts";
import type {
    ProductResponse,
} from "@/types/product.d.ts";

// PUBLIC - Không cần token
export const getProducts = ({
    page = 0,
    size = 10,
    keyword = null,
    categoryIds = null,
    minPrice = null,
    maxPrice = null,
    sort = null
}: Partial<PaginationParams> & {
    categoryIds?: number[] | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    sort?: string | null;
} = {}) => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (keyword) params.append("keyword", keyword);
    if (sort) params.append("sort", sort);
    if (categoryIds && categoryIds.length > 0) {
        categoryIds.forEach(id => params.append("categoryIds", id.toString()));
    }
    if (minPrice && minPrice > 0) params.append("minPrice", minPrice.toString());
    if (maxPrice && maxPrice > 0) params.append("maxPrice", maxPrice.toString());

    return axiosClient.get<ApiResponse<PageResponseDto<ProductResponse>>>(
        `/products?${params.toString()}`
    );
};

// PUBLIC - Không cần token
export const getProductById = (id: number) => {
    return axiosClient.get<ApiResponse<ProductResponse>>(
        `/products/${id}`
    );
};

// ADMIN - Cần token
export const createProduct = (data: FormData) => {
    return axiosClient.post<ApiResponse<ProductResponse>>(
        "/products",
        data,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
};

// ADMIN - Cần token
export const updateProduct = (id: number, data: FormData) => {
    return axiosClient.put<ApiResponse<ProductResponse>>(
        `/products/${id}`,
        data,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
};

// ADMIN - Cần token
export const deleteProduct = (id: number) => {
    return axiosClient.delete<ApiResponse<void>>(
        `/products/${id}`
    );
};
