// --- REQUEST INTERFACES ---

/**
 * Dữ liệu yêu cầu thông tin phiên (SessionMetaRequest)
 */
export interface SessionMetaRequest {
    deviceName: string;
    deviceType: string;
    userAgent: string;
}

/**
 * Yêu cầu Đăng nhập (LoginRequest)
 */
export interface LoginRequest {
    email: string;
    password: string;
    sessionMetaRequest: SessionMetaRequest | null;
}

/**
 * Yêu cầu Quên mật khẩu (ForgotPasswordRequest)
 */
export interface ForgotPasswordRequest {
    email: string;
}

/**
 * Yêu cầu Đăng ký (RegisterRequest)
 * Lưu ý: dateBirth (LocalDate) được biểu diễn bằng string trong JSON.
 * gender là một chuỗi hạn chế (MALE|FEMALE|OTHER).
 */
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    dateBirth: string;
    address?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * Yêu cầu Xác thực OTP (VerifyOtpRequest)
 */
export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

/**
 * Yêu cầu Đặt lại mật khẩu (ResetPasswordRequest)
 */
export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}


// --- RESPONSE INTERFACES ---

/**
 * Dữ liệu phản hồi chi tiết phiên người dùng (UserSessionResponse)
 * Giả định cấu trúc cơ bản
 */
export interface UserSessionResponse {
    id: string;
    name: string;
    email: string;
    permissions: string[];
    role: string;
    logoUrl: string;
    updatedAt: string;
}
/**
 * Phản hồi Token Xác thực (AuthTokenResponse)
 * Tương ứng với @JsonPropertyOrder({"user", "accessToken"})
 */
export interface AuthTokenResponse {
    user: UserSessionResponse;
    accessToken: string;
}


/**
 * Phản hồi Gửi OTP (OtpResponse)
 */
export interface OtpResponse {
    success: boolean;
    message: string;
    expiresIn: number;
    remainingAttempts: number;
}

/**
 * Phản hồi Đặt lại mật khẩu (ResetPasswordResponse)
 */
export interface ResetPasswordResponse {
    success: boolean;
    message: string;
}

/**
 * Phản hồi Thông tin phiên (SessionMetaResponse)
 * Lưu ý: loginAt (Instant) được biểu diễn bằng string (ISO 8601).
 */
export interface SessionMetaResponse {
    sessionId: string;
    deviceName: string;
    deviceType: string;
    userAgent: string;
    loginAt: string;
    current: boolean;
}

/**
 * Phản hồi Xác thực OTP (VerifyOtpResponse)
 */
export interface VerifyOtpResponse {
    success: boolean;
    message: string;
    valid: boolean;
}