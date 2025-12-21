
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { CartResponse, AddToCartRequest, UpdateCartItemRequest } from "@/types/cart.d.ts";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "@/services/cartApi";
import { toast } from "sonner";

interface CartState {
    cart: CartResponse | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: CartState = {
    cart: null,
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchCart = createAsyncThunk(
    "cart/fetchCart",
    async (_, { rejectWithValue }) => {
        try {
            const response = await getCart();
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch cart");
        }
    }
);

export const addToCartThunk = createAsyncThunk(
    "cart/addToCart",
    async (data: AddToCartRequest, { rejectWithValue }) => {
        try {
            const response = await addToCart(data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to add to cart");
        }
    }
);

export const updateCartItemThunk = createAsyncThunk(
    "cart/updateCartItem",
    async (data: UpdateCartItemRequest, { rejectWithValue }) => {
        try {
            const response = await updateCartItem(data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to update cart item");
        }
    }
);

export const removeCartItemThunk = createAsyncThunk(
    "cart/removeCartItem",
    async (data: UpdateCartItemRequest, { rejectWithValue }) => {
        try {
            const response = await removeFromCart(data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to remove cart item");
        }
    }
);

export const clearCartThunk = createAsyncThunk(
    "cart/clearCart",
    async (_, { rejectWithValue }) => {
        try {
            await clearCart();
            return null;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to clear cart");
        }
    }
);

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        resetCart: (state) => {
            state.cart = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Cart
        builder.addCase(fetchCart.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartResponse>) => {
            state.isLoading = false;
            state.cart = action.payload;
        });
        builder.addCase(fetchCart.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Add to Cart
        builder.addCase(addToCartThunk.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(addToCartThunk.fulfilled, (state, action: PayloadAction<CartResponse>) => {
            state.isLoading = false;
            state.cart = action.payload;
            toast.success("Đã thêm sản phẩm vào giỏ hàng");
        });
        builder.addCase(addToCartThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
            toast.error(state.error);
        });

        // Update Cart Item
        builder.addCase(updateCartItemThunk.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(updateCartItemThunk.fulfilled, (state, action: PayloadAction<CartResponse>) => {
            state.isLoading = false;
            state.cart = action.payload;
            toast.success("Đã cập nhật giỏ hàng");
        });
        builder.addCase(updateCartItemThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
            toast.error(state.error);
        });

        // Remove Cart Item
        builder.addCase(removeCartItemThunk.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(removeCartItemThunk.fulfilled, (state, action: PayloadAction<CartResponse>) => {
            state.isLoading = false;
            state.cart = action.payload;
            toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
        });
        builder.addCase(removeCartItemThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
            toast.error(state.error);
        });

        // Clear Cart
        builder.addCase(clearCartThunk.fulfilled, (state) => {
            state.cart = null;
            toast.success("Đã xóa toàn bộ giỏ hàng");
        });
    },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
