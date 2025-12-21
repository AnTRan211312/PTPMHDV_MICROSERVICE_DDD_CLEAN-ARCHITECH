// --- PERMISSION SUB-INTERFACES FOR ROLE ---

/**
 * ID Quyền (PermissionId) - dùng trong RoleRequest
 * Chỉ cần ID để gửi lên server khi tạo/cập nhật Role.
 */
export interface RolePermissionId {
    id: number; // ID của quyền hạn
}

/**
 * Chi tiết về một Quyền (Permission) - dùng trong RoleResponse
 * Cung cấp thông tin đầy đủ về quyền được gán cho Role.
 */
export interface RolePermissionDetail {
    id: number;
    name: string;
    apiPath: string;
    method: string;
    module: string;
}

// --- REQUEST INTERFACE ---

/**
 * Yêu cầu tạo mới hoặc cập nhật Vai trò (RoleRequest)
 */
export interface RoleRequest {
    name: string;
    description: string;
    active: boolean;
    permissions: RolePermissionId[]; // Sử dụng danh sách ID quyền
}

// --- RESPONSE INTERFACE ---

/**
 * Phản hồi thông tin Vai trò (RoleResponse)
 */
export interface RoleResponse {
    id: number;
    name: string;
    description: string;
    active: boolean;
    createdAt: string; // Thời gian tạo (ISO 8601 string)
    updatedAt: string; // Thời gian cập nhật (ISO 8601 string)
    permissions: RolePermissionDetail[]; // Sử dụng danh sách chi tiết quyền
}