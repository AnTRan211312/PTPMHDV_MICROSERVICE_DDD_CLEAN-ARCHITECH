import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/apiResponse.d.ts";
import type {
    AddToCartRequest,
    UpdateCartItemRequest,
    CartResponse,
} from "@/types/cart.d.ts";

export const getCart = () => {
    return axiosClient.get<ApiResponse<CartResponse>>("/carts/my");
};

export const addToCart = (data: AddToCartRequest) => {
    return axiosClient.post<ApiResponse<CartResponse>>(
        "/carts/my/items",
        data
    );
};

export const updateCartItem = (data: UpdateCartItemRequest) => {
    return axiosClient.put<ApiResponse<CartResponse>>(
        "/carts/my/items",
        data
    );
};

export const removeFromCart = (data: UpdateCartItemRequest) => {
    return axiosClient.delete<ApiResponse<CartResponse>>(
        "/carts/my/items",
        { data }
    );
};

export const clearCart = () => {
    return axiosClient.delete<ApiResponse<void>>("/carts/my");
};
