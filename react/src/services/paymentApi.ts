import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
} from "@/types/apiResponse.d.ts";
import type {
    PaymentResponse,
    PaymentCallbackResponse,
    CreatePaymentRequest,
} from "@/types/payment.d.ts";

export const createPayment = (
    orderId: number,
    data: CreatePaymentRequest
) => {
    return axiosClient.post<ApiResponse<PaymentResponse>>(
        `/payments?orderId=${orderId}`,
        data
    );
};

export const handlePaymentCallback = (params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    return axiosClient.get<ApiResponse<PaymentCallbackResponse>>(
        `/payments/callback?${queryString}`
    );
};

export const getPaymentByOrderId = (orderId: number) => {
    return axiosClient.get<ApiResponse<PaymentResponse>>(
        `/payments/order/${orderId}`
    );
};
