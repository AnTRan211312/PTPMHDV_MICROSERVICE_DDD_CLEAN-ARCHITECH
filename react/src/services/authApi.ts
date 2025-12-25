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
import type { UserDetailsResponse } from "@/types/user";


export const loginApi = (data: LoginRequest) => {
    return axiosClient.post<ApiResponse<AuthTokenResponse>>(
        `/auth/login`,
        {
            ...data,
            SessionMetaRequest: getSessionMeta(),
        }
    );
};

export const registerApi = (data: RegisterRequest) => {
    return axiosClient.post(`/auth/register`, data);
};

export const logoutApi = () => {
    return axiosClient.post(`/auth/logout`, {});
};
export const getUserSession = () => {
    return axiosClient.get<ApiResponse<UserSessionResponse>>("/auth/me");
};
export const refreshTokenApi = () => {
    const data: SessionMetaRequest = getSessionMeta();

    return axiosClient.post<ApiResponse<AuthTokenResponse>>(
        "/auth/refresh-token",
        data
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