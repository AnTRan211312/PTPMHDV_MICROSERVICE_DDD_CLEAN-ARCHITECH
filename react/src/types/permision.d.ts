// --- REQUEST INTERFACE ---

/**
 * Yêu cầu tạo mới hoặc cập nhật thông tin Quyền (PermissionRequest)
 * Dùng cho việc gửi dữ liệu quyền lên server.
 */
export interface PermissionRequest {
    name: string;      // Tên quyền (ví dụ: 'READ_USERS')
    apiPath: string;   // Đường dẫn API (ví dụ: '/api/v1/users')
    method: string;    // Phương thức HTTP (ví dụ: 'GET', 'POST', 'PUT', 'DELETE')
    module: string;    // Module liên quan (ví dụ: 'USER_MANAGEMENT')
}

// --- RESPONSE INTERFACE ---

/**
 * Phản hồi thông tin Quyền (PermissionResponse)
 * Dùng cho việc nhận dữ liệu quyền từ server, bao gồm ID và thời gian.
 */
export interface PermissionResponse {
    id: number;        // ID của quyền (Long trong Java -> number trong TS)
    name: string;
    apiPath: string;
    method: string;
    module: string;
    createdAt: string; // Thời gian tạo (thường là ISO 8601 string)
    updatedAt: string; // Thời gian cập nhật (thường là ISO 8601 string)
}