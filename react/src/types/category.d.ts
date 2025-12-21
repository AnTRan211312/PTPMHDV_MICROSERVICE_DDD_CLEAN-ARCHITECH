// --- REQUEST INTERFACES ---

/**
 * Yêu cầu tạo danh mục (CreateCategoryRequest)
 */
export interface CreateCategoryRequest {
    name: string;
    description?: string;
}

/**
 * Yêu cầu cập nhật danh mục (UpdateCategoryRequest)
 */
export interface UpdateCategoryRequest {
    id: number;              // Long -> number
    name?: string;
    description?: string;
}

// --- RESPONSE INTERFACE ---

/**
 * Phản hồi danh mục (CategoryResponse)
 */
export interface CategoryResponse {
    id: number;              // Long -> number
    name: string;
    description: string;
    createdAt: string;       // Instant -> ISO 8601 string
    updatedAt: string;       // Instant -> ISO 8601 string
}

/**
 * Phản hồi danh sách danh mục (phân trang)
 */
export interface CategoryListResponse {
    content: CategoryResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
