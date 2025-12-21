// --- REQUEST INTERFACES ---

/**
 * Yêu cầu tạo thanh toán (CreatePaymentRequest)
 */
export interface CreatePaymentRequest {
    paymentMethod: string;  // "VNPAY"
    returnUrl?: string;     // Optional override
}

// --- RESPONSE INTERFACES ---

/**
 * Phản hồi thanh toán (PaymentResponse)
 */
export interface PaymentResponse {
    paymentId: number;       // Long -> number
    orderId: number;         // Long -> number
    paymentUrl: string;      // URL để redirect đến VNPay
    status: string;          // "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED"
    amount: number;          // BigDecimal -> number
    createdAt: string;       // Instant -> ISO 8601 string
}

/**
 * Phản hồi callback từ VNPay (PaymentCallbackResponse)
 */
export interface PaymentCallbackResponse {
    success: boolean;
    message: string;
    orderId: number;         // Long -> number
    transactionId: string;   // ID giao dịch từ VNPay
}

/**
 * Phản hồi danh sách thanh toán (phân trang)
 */
export interface PaymentListResponse {
    content: PaymentResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
