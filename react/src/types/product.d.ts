// --- REQUEST INTERFACES ---

/**
 * Yêu cầu tạo sản phẩm mới (CreateProductRequest)
 */
export interface CreateProductRequest {
    name: string;
    description: string;
    price: number;           // BigDecimal -> number
    discountPrice?: number;  // BigDecimal | null -> number | null
    thumbnail?: string;      // URL hoặc file
    images?: string[];       // Danh sách URL hoặc files
    categoryIds?: number[];  // List<Long> -> number[]
}

/**
 * Yêu cầu cập nhật sản phẩm (UpdateProductRequest)
 */
export interface UpdateProductRequest {
    id: number;              // Long -> number
    name?: string;
    description?: string;
    price?: number;          // BigDecimal -> number
    discountPrice?: number;  // BigDecimal | null -> number | null
    thumbnail?: string;
    images?: string[];
    categoryIds?: number[];  // List<Long> -> number[]
}

// --- RESPONSE SUB-INTERFACES ---

/**
 * Thông tin danh mục (CategoryDto)
 */
export interface CategoryDto {
    id: number;              // Long -> number
    name: string;
    description: string;
}

/**
 * Thông tin đánh giá (ReviewDto)
 */
export interface ReviewDto {
    id: number;              // Long -> number
    userEmail: string;
    rating: number;          // int -> number (1-5)
    comment: string;
    createdAt: string;       // Instant -> ISO 8601 string
}

// --- MAIN RESPONSE INTERFACE ---

/**
 * Phản hồi chi tiết sản phẩm (ProductResponse)
 */
export interface ProductResponse {
    id: number;              // Long -> number
    name: string;
    description: string;
    price: number;           // BigDecimal -> number
    discountPrice: number | null; // BigDecimal | null -> number | null
    thumbnail: string;       // URL
    images: string[];        // Danh sách URL
    categories: CategoryDto[];
    reviews: ReviewDto[];
    averageRating: number;   // Double -> number
    reviewCount: number;     // Long -> number
    createdAt: string;       // Instant -> ISO 8601 string
    updatedAt: string;       // Instant -> ISO 8601 string
}

/**
 * Phản hồi danh sách sản phẩm (phân trang)
 */
export interface ProductListResponse {
    content: ProductResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
