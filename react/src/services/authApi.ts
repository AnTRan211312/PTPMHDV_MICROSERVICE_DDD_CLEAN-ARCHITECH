import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/apiResponse.d.ts";
import type {
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    AuthTokenResponse,
    SessionMetaRequest,
    SessionMetaResponse,
    UserSessionResponse,
    OtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse
} from "@/types/auth.d.ts";
import { getSessionMeta } from "@/utils/sessionHelper";
import axios from "axios";
import type { UserDetailsResponse } from "@/types/user";


const URL = "http://localhost:8080/api";
export const loginApi = (data: LoginRequest) => {
    return axios.post<ApiResponse<AuthTokenResponse>>(
        `${URL}/auth/login`,
        {
            ...data,
            SessionMetaRequest: getSessionMeta(),
        },
        { withCredentials: true }
    );
};

export const registerApi = (data: RegisterRequest) => {
    return axios.post(`${URL}/auth/register`, data, {
        withCredentials: true,
    });
};

export const logoutApi = () => {
    return axios.post(
        `${URL}/auth/logout`,
        {},
        {
            withCredentials: true
        }
    );
};
export const getUserSession = () => {
    return axiosClient.get<ApiResponse<UserSessionResponse>>("/auth/me");
};
export const refreshTokenApi = () => {
    const data: SessionMetaRequest = getSessionMeta();

    return axios.post<ApiResponse<AuthTokenResponse>>(
        "http://localhost:8080/api/auth/refresh-token",
        data,
        { withCredentials: true },
    );
};

export const getSessions = () => {
    return axiosClient.get<ApiResponse<SessionMetaResponse[]>>(`/auth/sessions`);
};
export const removeSessionId = (sessionId: string) => {
    return axiosClient.delete(`/auth/sessions/${sessionId}`);
};

export const getUserDetails = () => {
    return axiosClient.get<ApiResponse<UserDetailsResponse>>(
        "/auth/me/details",
    );
};
/* ============================================================
   OTP / PASSWORD RECOVERY — axios thường
============================================================ */

export const forgotPassword = (data: ForgotPasswordRequest) => {
    return axiosClient.post<ApiResponse<OtpResponse>>(
        "/auth/forgot-password",
        data,
    );
};

export const resendOtp = (data: ForgotPasswordRequest) => {
    return axiosClient.post<ApiResponse<OtpResponse>>(
        "/auth/resend-otp",
        data,
    );
};

export const verifyOtp = (data: VerifyOtpRequest) => {
    return axiosClient.post<ApiResponse<VerifyOtpResponse>>(
        "/auth/verify-otp",
        data,
    );
};

export const resetPassword = (data: ResetPasswordRequest) => {
    return axiosClient.post<ApiResponse<ResetPasswordResponse>>(
        "/auth/reset-password",
        data,
    );
};