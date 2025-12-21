// --- REQUEST INTERFACES ---

/**
 * Yêu cầu checkout với các sản phẩm được chọn (CheckoutSelectedRequest)
 */
export interface CheckoutSelectedRequest {
    productIds: number[]; // List<Long> -> number[]
}

// --- RESPONSE SUB-INTERFACES ---

/**
 * Chi tiết một item trong đơn hàng (OrderItemResponse)
 */
export interface OrderItemResponse {
    productId: number;       // Long -> number
    productName: string;
    productDescription: string;
    productImage: string;
    price: number;           // BigDecimal -> number (giá gốc)
    discountPrice: number | null; // BigDecimal | null -> number | null
    quantity: number;        // Integer -> number
    subtotal: number;        // BigDecimal -> number (effectivePrice * quantity)
}

// --- MAIN RESPONSE INTERFACE ---

/**
 * Phản hồi đơn hàng (OrderResponse)
 */
export interface OrderResponse {
    orderId: number;         // Long -> number
    userId: number;          // Long -> number
    orderCode: string;       // ví dụ: "ORD-20251216-0001"
    items: OrderItemResponse[];
    totalItems: number;      // Integer -> number
    totalAmount: number;     // BigDecimal -> number
    status: string;          // "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "COMPLETED" | "SHIPPING" | "DELIVERED"
    createdAt: string;       // Instant -> ISO 8601 string
}

/**
 * Phản hồi danh sách đơn hàng (phân trang)
 */
export interface OrderListResponse {
    content: OrderResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

/**
 * Thống kê đơn hàng (OrderStatsResponse)
 */
export interface OrderStatsResponse {
    total: number;
    pendingPayment: number;
    paid: number;
    shipping: number;
    delivered: number;
    completed: number;
    cancelled: number;
}
