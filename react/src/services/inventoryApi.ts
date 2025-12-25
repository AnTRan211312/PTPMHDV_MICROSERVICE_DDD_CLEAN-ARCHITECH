import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
    PageResponseDto,
} from "@/types/apiResponse.d.ts";
import type {
    InventoryResponse,
    CreateInventoryRequest,
    UpdateInventoryRequest,
    InventoryQuantityResponse,
    ReduceStockRequest,
    InventoryStatsResponse,
} from "@/types/inventory.d.ts";

// ADMIN - Cần token, hỗ trợ tìm kiếm theo keyword (tên sản phẩm hoặc Product ID) và stockStatus
export const getInventories = (page: number = 0, size: number = 10, keyword?: string, stockStatus?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });

    // Nếu có stockStatus, ưu tiên filter theo trạng thái (không dùng keyword)
    if (stockStatus && stockStatus.trim()) {
        params.append("stockStatus", stockStatus.trim());
    } else if (keyword && keyword.trim()) {
        // Nếu keyword là số, tìm theo productId, ngược lại tìm theo tên
        if (/^\d+$/.test(keyword.trim())) {
            params.append("productId", keyword.trim());
        } else {
            params.append("keyword", keyword.trim());
        }
    }

    return axiosClient.get<ApiResponse<PageResponseDto<InventoryResponse>>>(
        `/inventory?${params.toString()}`
    );
};

// ADMIN - Lấy thống kê tồn kho
export const getInventoryStats = () => {
    return axiosClient.get<ApiResponse<InventoryStatsResponse>>("/inventory/stats");
};

// ADMIN - Cần token
export const createInventory = (
    productId: number,
    data: CreateInventoryRequest
) => {
    return axiosClient.post<ApiResponse<InventoryResponse>>(
        `/inventory/${productId}`,
        data
    );
};

// ADMIN - Cần token
export const updateInventory = (
    productId: number,
    data: UpdateInventoryRequest
) => {
    return axiosClient.put<ApiResponse<InventoryResponse>>(
        `/inventory/${productId}`,
        data
    );
};

// ADMIN - Cần token
export const deleteInventory = (productId: number) => {
    return axiosClient.delete<ApiResponse<void>>(
        `/inventory/${productId}`
    );
};

// PUBLIC - Không cần token
export const getInventory = (productId: number) => {
    return axiosClient.get<ApiResponse<InventoryResponse>>(
        `/inventory/${productId}`
    );
};

// PUBLIC - Không cần token (Internal API)
export const getQuantitiesByProductIds = (productIds: number[]) => {
    const queryString = new URLSearchParams({
        productIds: productIds.join(","),
    }).toString();
    return axiosClient.get<ApiResponse<InventoryQuantityResponse[]>>(
        `/inventory/batch?${queryString}`
    );
};

// PUBLIC - Không cần token (Internal API)
export const reduceMultipleStock = (requests: ReduceStockRequest[]) => {
    return axiosClient.post<ApiResponse<void>>(
        `/inventory/reduce-multiple`,
        requests
    );
};

// PUBLIC - Không cần token (Internal API)
export const restoreStock = (productId: number, quantity: number) => {
    return axiosClient.post<ApiResponse<void>>(
        `/inventory/${productId}/restore?quantity=${quantity}`,
        {}
    );
};
