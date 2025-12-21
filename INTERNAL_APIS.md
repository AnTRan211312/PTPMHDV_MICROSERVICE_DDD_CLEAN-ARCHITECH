# Internal APIs Documentation

## Tổng Quan
Các API internal được sử dụng để các service giao tiếp với nhau mà không cần authentication. Chúng được sử dụng bởi các Feign Client.

---

## 1. Cart Service Internal APIs

### Base URL: `/api/carts/internal`

#### 1.1 Lấy giỏ hàng của user
```
GET /api/carts/internal/{userId}
Response: CartResponse
```
- Lấy toàn bộ thông tin giỏ hàng của user
- Dùng bởi: OrderService

#### 1.2 Xóa toàn bộ giỏ hàng
```
DELETE /api/carts/internal/{userId}
Response: 204 No Content
```
- Xóa tất cả items trong giỏ hàng
- Dùng bởi: OrderService (sau khi tạo đơn hàng thành công)

#### 1.3 Xóa các items cụ thể
```
DELETE /api/carts/internal/{userId}/items?itemIds=1,2,3
Response: 204 No Content
```
- Xóa các items được chọn khỏi giỏ hàng
- Dùng bởi: OrderService (khi checkout selected items)

#### 1.4 Lấy tổng tiền giỏ hàng
```
GET /api/carts/internal/{userId}/total
Response: CartTotalResponse {
  userId: Long,
  totalAmount: BigDecimal,
  totalItems: Integer
}
```
- Lấy tổng tiền và số lượng items
- Dùng bởi: PaymentService

#### 1.5 Kiểm tra giỏ hàng có trống không
```
GET /api/carts/internal/{userId}/empty
Response: Boolean
```
- Trả về true nếu giỏ hàng trống
- Dùng bởi: OrderService

#### 1.6 Lấy số lượng items trong giỏ
```
GET /api/carts/internal/{userId}/count
Response: Integer
```
- Lấy tổng số lượng items
- Dùng bởi: Frontend (hiển thị badge)

---

## 2. Order Service Internal APIs

### Base URL: `/api/orders/internal`

#### 2.1 Lấy chi tiết đơn hàng
```
GET /api/orders/internal/{orderId}
Response: OrderResponse
```
- Lấy toàn bộ thông tin đơn hàng
- Dùng bởi: PaymentService, NotificationService

#### 2.2 Lấy danh sách đơn hàng của user
```
GET /api/orders/internal/user/{userId}
Response: List<OrderResponse>
```
- Lấy tất cả đơn hàng của user (không phân trang)
- Dùng bởi: NotificationService

#### 2.3 Cập nhật status đơn hàng
```
PATCH /api/orders/internal/{orderId}/status
Request: UpdateOrderStatusRequest {
  status: String
}
Response: OrderResponse
```
- Cập nhật trạng thái đơn hàng
- Status: PENDING_PAYMENT, PAID, CANCELLED, COMPLETED, SHIPPING, DELIVERED
- Dùng bởi: PaymentService (khi thanh toán thành công/thất bại)

#### 2.4 Kiểm tra đơn hàng có tồn tại không
```
GET /api/orders/internal/{orderId}/exists
Response: Boolean
```
- Trả về true nếu đơn hàng tồn tại
- Dùng bởi: PaymentService

#### 2.5 Lấy tổng tiền đơn hàng
```
GET /api/orders/internal/{orderId}/total
Response: OrderTotalResponse {
  orderId: Long,
  totalAmount: BigDecimal,
  status: String
}
```
- Lấy tổng tiền và status
- Dùng bởi: PaymentService

---

## 3. Inventory Service Internal APIs

### Base URL: `/api/internal/inventories`

#### 3.1 Lấy số lượng tồn kho của một sản phẩm
```
GET /api/internal/inventories/quantity/{productId}
Response: InventoryQuantityResponse {
  productId: Long,
  quantity: Integer
}
```
- Lấy số lượng tồn kho hiện tại
- Dùng bởi: CartService, OrderService

#### 3.2 Lấy số lượng tồn kho của nhiều sản phẩm
```
GET /api/internal/inventories/quantity/batch?productIds=1,2,3
Response: List<InventoryQuantityResponse>
```
- Lấy tồn kho cho nhiều sản phẩm cùng lúc
- Dùng bởi: OrderService

#### 3.3 Giảm tồn kho cho một sản phẩm
```
POST /api/internal/inventories/{productId}/reduce
Request: ReduceStockRequest {
  quantity: Integer
}
Response: 204 No Content
```
- Giảm tồn kho khi tạo đơn hàng
- Dùng bởi: OrderService

#### 3.4 Giảm tồn kho cho nhiều sản phẩm
```
POST /api/internal/inventories/reduce-multiple
Request: List<ReduceStockRequest> [
  { productId: 1, quantity: 5 },
  { productId: 2, quantity: 3 }
]
Response: 204 No Content
```
- Giảm tồn kho cho nhiều sản phẩm cùng lúc
- Dùng bởi: OrderService

#### 3.5 Restore tồn kho cho một sản phẩm
```
POST /api/internal/inventories/{productId}/restore
Request: RestoreStockRequest {
  quantity: Integer
}
Response: 204 No Content
```
- Hoàn trả tồn kho khi hủy đơn hàng
- Dùng bởi: OrderService

#### 3.6 Restore tồn kho cho nhiều sản phẩm
```
POST /api/internal/inventories/restore-multiple
Request: List<RestoreStockRequest> [
  { productId: 1, quantity: 5 },
  { productId: 2, quantity: 3 }
]
Response: 204 No Content
```
- Hoàn trả tồn kho cho nhiều sản phẩm
- Dùng bởi: OrderService, PaymentService

#### 3.7 Kiểm tra tồn kho của một sản phẩm
```
GET /api/internal/inventories/{productId}/check?quantity=5
Response: StockCheckResponse {
  productId: Long,
  requestedQuantity: Integer,
  availableQuantity: Integer,
  hasStock: Boolean
}
```
- Kiểm tra xem có đủ tồn kho không
- Dùng bởi: CartService, OrderService

#### 3.8 Kiểm tra tồn kho cho nhiều sản phẩm
```
POST /api/internal/inventories/check-multiple
Request: List<CheckStockRequest> [
  { productId: 1, quantity: 5 },
  { productId: 2, quantity: 3 }
]
Response: List<StockCheckResponse>
```
- Kiểm tra tồn kho cho nhiều sản phẩm cùng lúc
- Dùng bởi: OrderService

---

## Flow Ví Dụ

### Tạo Đơn Hàng (Checkout)
1. **OrderController** nhận request từ client
2. **OrderService** gọi **CartServiceClient** → `GET /api/carts/internal/{userId}`
3. **OrderService** gọi **InventoryServiceClient** → `GET /api/internal/inventories/quantity/batch`
4. **OrderService** gọi **InventoryServiceClient** → `POST /api/internal/inventories/reduce-multiple`
5. **OrderService** tạo Order entity và lưu vào DB
6. **OrderService** gọi **CartServiceClient** → `DELETE /api/carts/internal/{userId}`
7. Trả về OrderResponse cho client

### Thanh Toán (Payment)
1. **PaymentService** nhận request từ client
2. **PaymentService** gọi **OrderServiceClient** → `GET /api/orders/internal/{orderId}/total`
3. **PaymentService** xử lý thanh toán với VNPAY
4. Nếu thành công:
   - **PaymentService** gọi **OrderServiceClient** → `PATCH /api/orders/internal/{orderId}/status` (PAID)
5. Nếu thất bại:
   - **PaymentService** gọi **InventoryServiceClient** → `POST /api/internal/inventories/restore-multiple`
   - **PaymentService** gọi **OrderServiceClient** → `PATCH /api/orders/internal/{orderId}/status` (CANCELLED)

### Hủy Đơn Hàng
1. **OrderController** nhận request từ client
2. **OrderService** kiểm tra quyền sở hữu
3. **OrderService** gọi **InventoryServiceClient** → `POST /api/internal/inventories/restore-multiple`
4. **OrderService** cập nhật Order status thành CANCELLED
5. Trả về OrderResponse cho client

---

## Lưu Ý Bảo Mật

- Các API internal **KHÔNG** yêu cầu authentication
- Chỉ được gọi từ các service khác thông qua Feign Client
- **KHÔNG** expose ra ngoài API Gateway
- Cần cấu hình firewall/network policy để chỉ cho phép gọi từ các service nội bộ

---

## Cấu Hình Feign Client

### CartServiceClient
```java
@FeignClient(name = "cart-service")
public interface CartServiceClient {
    @GetMapping("/api/carts/internal/{userId}")
    CartResponse getCartByUserId(@PathVariable("userId") Long userId);
    
    @DeleteMapping("/api/carts/internal/{userId}")
    void clearCart(@PathVariable("userId") Long userId);
    
    @DeleteMapping("/api/carts/internal/{userId}/items")
    void removeCartItems(@PathVariable("userId") Long userId, @RequestParam("itemIds") List<Long> itemIds);
}
```

### OrderServiceClient
```java
@FeignClient(name = "order-service")
public interface OrderServiceClient {
    @GetMapping("/api/orders/internal/{orderId}")
    OrderResponse getOrderById(@PathVariable("orderId") Long orderId);
    
    @PatchMapping("/api/orders/internal/{orderId}/status")
    OrderResponse updateOrderStatus(@PathVariable("orderId") Long orderId, @RequestBody UpdateOrderStatusRequest request);
}
```

### InventoryServiceClient
```java
@FeignClient(name = "inventory-service")
public interface InventoryServiceClient {
    @GetMapping("/api/internal/inventories/quantity/{productId}")
    InventoryQuantityResponse getQuantity(@PathVariable("productId") Long productId);
    
    @PostMapping("/api/internal/inventories/reduce-multiple")
    void reduceMultipleStock(@RequestBody List<ReduceStockRequest> requests);
    
    @PostMapping("/api/internal/inventories/restore-multiple")
    void restoreMultipleStock(@RequestBody List<RestoreStockRequest> requests);
}
```
