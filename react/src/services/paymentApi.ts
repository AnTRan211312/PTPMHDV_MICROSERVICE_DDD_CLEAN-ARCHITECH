import axiosClient from "@/lib/axiosClient";
import axios from "axios";
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
    return axios.get<ApiResponse<PaymentCallbackResponse>>(
        `http://localhost:8080/api/payments/callback?${queryString}`,
        { withCredentials: true }
    );
};

export const getPaymentByOrderId = (orderId: number) => {
    return axiosClient.get<ApiResponse<PaymentResponse>>(
        `/payments/order/${orderId}`
    );
};
