// --- REQUEST INTERFACES ---

/**
 * Yêu cầu thêm sản phẩm vào giỏ hàng (AddToCartRequest)
 */
export interface AddToCartRequest {
    productId: number; // Long -> number
    quantity: number;  // Integer -> number
}

/**
 * Yêu cầu cập nhật hoặc xóa item trong giỏ hàng (UpdateCartItemRequest)
 */
export interface UpdateCartItemRequest {
    productId: number; // Long -> number
    quantity: number;  // Integer -> number
}

// --- RESPONSE SUB-INTERFACES ---

/**
 * Chi tiết một item trong giỏ hàng (CartItemResponse)
 */
export interface CartItemResponse {
    id: number;              // Long -> number
    productId: number;       // Long -> number
    productName: string;
    productImage: string;    // Add missing field
    originalPrice: number;   // BigDecimal -> number
    discountPrice: number | null; // BigDecimal | null -> number | null
    effectivePrice: number;  // BigDecimal -> number (giá thực tế sau discount)
    quantity: number;        // Integer -> number
    subtotal: number;        // BigDecimal -> number (effectivePrice * quantity)
}

// --- MAIN RESPONSE INTERFACE ---

/**
 * Phản hồi giỏ hàng (CartResponse)
 */
export interface CartResponse {
    cartId: number;          // Long -> number
    userId: number;          // Long -> number
    items: CartItemResponse[];
    totalItems: number;      // Integer -> number
    totalAmount: number;     // BigDecimal -> number
}
