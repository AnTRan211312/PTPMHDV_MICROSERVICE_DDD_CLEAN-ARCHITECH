export interface InventoryResponse {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInventoryRequest {
    quantity: number;
}

export interface UpdateInventoryRequest {
    quantity: number;
}

export interface InventoryQuantityResponse {
    productId: number;
    quantity: number;
}

export interface ReduceStockRequest {
    productId: number;
    quantity: number;
}

export interface InventoryStatsResponse {
    total: number;
    lowStock: number;
    outOfStock: number;
}
