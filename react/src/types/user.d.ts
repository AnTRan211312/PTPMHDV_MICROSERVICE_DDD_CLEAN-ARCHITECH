// --- REQUEST SUB-INTERFACE ---

/**
 * Dữ liệu ID chức vụ (RoleIdDto)
 * Dùng để gán chức vụ khi tạo hoặc cập nhật User.
 */
export interface RoleIdDto {
    id: number; // Tương ứng với Long
}

// --- MAIN REQUEST INTERFACES ---

/**
 * Yêu cầu tạo Người dùng mới (UserCreateRequest)
 * Lưu ý: LocalDate được biểu diễn bằng string (YYYY-MM-DD).
 */
export interface UserCreateRequest {
    name: string;
    email: string;
    password?: string; // Có thể cần trong trường hợp tạo user
    phoneNumber: string;
    dateBirth: string; // Tương ứng với LocalDate
    address?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    role: RoleIdDto;
}

/**
 * Yêu cầu cập nhật Người dùng (UserUpdateRequest)
 * Dùng cho người quản trị cập nhật thông tin User khác (không bao gồm email/password).
 * Lưu ý: Các trường không có @NotBlank có thể là optional, nhưng ở đây tôi để string/number/boolean để match với type.
 */
export interface UserUpdateRequest {
    id: number; // ID của người dùng cần cập nhật
    name?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    birthdate?: string; // Tương ứng với LocalDate
    phoneNumber?: string;
    address?: string;
    role?: RoleIdDto;
}

/**
 * Yêu cầu cập nhật Mật khẩu cá nhân (SelfUserUpdatePasswordRequest)
 */
export interface SelfUserUpdatePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

/**
 * Yêu cầu cập nhật Hồ sơ cá nhân (SelfUserUpdateProfileRequest)
 * Lưu ý: dateBirth (LocalDate) được biểu diễn bằng string (YYYY-MM-DD).
 */
export interface SelfUserUpdateProfileRequest {
    name: string;
    email: string;
    phoneNumber: string;
    dateBirth: string; // Tương ứng với LocalDate
    address?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// --- RESPONSE SUB-INTERFACE ---

/**
 * Thông tin chi tiết Chức vụ (RoleInformationDto)
 * Dùng để hiển thị trong UserResponse.
 */
export interface RoleInformationDto {
    id: number;
    name: string;
    description: string;
}

// --- MAIN RESPONSE INTERFACES ---

/**
 * Phản hồi chi tiết Người dùng (UserDetailsResponse)
 * Lưu ý: LocalDate và Instant được biểu diễn bằng string.
 */
export interface UserDetailsResponse {
    id: number;
    name: string;
    email: string;
    dob?: string;          // Tương ứng với LocalDate
    phoneNumber?: string;
    address?: string;
    gender?: string;
    logoUrl?: string;
    createdAt?: string;    // Tương ứng với Instant
    updatedAt?: string;    // Tương ứng với Instant
}


/**
 * Phản hồi Người dùng (UserResponse) - Phản hồi chung
 * Lưu ý: LocalDate và Instant được biểu diễn bằng string.
 */
export interface UserResponse {
    id: number;
    name: string;
    email: string;
    dob?: string;          // Tương ứng với LocalDate
    phoneNumber?: string;
    address?: string;
    gender?: string;
    logoUrl?: string;
    role: RoleInformationDto; // Thông tin chức vụ
    createdAt?: string;    // Tương ứng với Instant
    updatedAt?: string;    // Tương ứng với Instant
}

// NOTE: UserSessionResponse is defined in auth.d.ts and re-exported via index.ts
// Do not duplicate it here to avoid export ambiguity errors