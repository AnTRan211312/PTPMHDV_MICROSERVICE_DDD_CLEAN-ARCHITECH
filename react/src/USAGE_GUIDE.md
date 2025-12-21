# Hướng dẫn sử dụng HasPermission và axiosClient

## 1. HasPermission Component

### Mục đích
Kiểm tra quyền hạn của user và hiển thị/ẩn UI elements dựa trên quyền.

### Cách sử dụng

#### 1.1 Kiểm tra một quyền
```tsx
import HasPermission from '@/page/commons/HasPermission';

export default function MyComponent() {
  return (
    <HasPermission perm="POST /api/products">
      <button>Tạo sản phẩm</button>
    </HasPermission>
  );
}
```

#### 1.2 Kiểm tra nhiều quyền (OR logic - chỉ cần một quyền)
```tsx
<HasPermission perm={["POST /api/products", "PUT /api/products/{id}"]}>
  <button>Quản lý sản phẩm</button>
</HasPermission>
```

#### 1.3 Ví dụ thực tế trong UserMenu
```tsx
<HasPermission perm={"GET /admin/dashboard/stats"}>
  <DropdownMenuItem>
    <Link to={"/admin/dashboard"}>
      <Shield className="h-4 w-4" />
      Quản trị
    </Link>
  </DropdownMenuItem>
</HasPermission>
```

### Cách hoạt động
1. Lấy user từ Redux store: `state.auth.user`
2. Kiểm tra `user.permissions` array
3. Nếu user có quyền → render children
4. Nếu không có quyền → return null (ẩn UI)

### Lưu ý
- Permission string phải khớp chính xác với backend (VD: `"POST /api/products"`)
- Nếu user chưa đăng nhập → return null
- Nếu user không có quyền → return null

---

## 2. axiosClient

### Mục đích
Axios instance được cấu hình sẵn với:
- Base URL: `http://localhost:8080/api`
- Tự động gắn Access Token vào header
- Xử lý 401 và refresh token tự động
- Hàng đợi request khi refresh token

### Cách sử dụng

#### 2.1 Tạo API service
```tsx
// services/productApi.ts
import axiosClient from '@/lib/axiosClient';
import type { ProductResponse } from '@/types/product';

export const getProducts = (page: number, size: number) => {
  return axiosClient.get<ApiResponse<PageResponseDto<ProductResponse>>>(
    '/products',
    { params: { page, size } }
  );
};

export const createProduct = (data: CreateProductRequest) => {
  return axiosClient.post<ApiResponse<ProductResponse>>(
    '/products',
    data
  );
};

export const updateProduct = (id: number, data: UpdateProductRequest) => {
  return axiosClient.put<ApiResponse<ProductResponse>>(
    `/products/${id}`,
    data
  );
};

export const deleteProduct = (id: number) => {
  return axiosClient.delete<ApiResponse<null>>(
    `/products/${id}`
  );
};
```

#### 2.2 Sử dụng trong component
```tsx
import { getProducts } from '@/services/productApi';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await getProducts(0, 10);
        setProducts(res.data.data.content);
      } catch (error) {
        toast.error('Lỗi khi lấy danh sách sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      {isLoading ? <p>Đang tải...</p> : <p>Có {products.length} sản phẩm</p>}
    </div>
  );
}
```

#### 2.3 Sử dụng trong Redux thunk
```tsx
// features/slices/productThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getProducts } from '@/services/productApi';
import type { ProductResponse } from '@/types/product';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: { page: number; size: number }, { rejectWithValue }) => {
    try {
      const res = await getProducts(params.page, params.size);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
```

### Interceptor tự động

#### Request Interceptor
```
Tự động thêm vào mỗi request:
Authorization: Bearer {access_token}
```

#### Response Interceptor
```
Nếu nhận 401 UNAUTHORIZED:
1. Gọi refreshTokenApi() để lấy token mới
2. Lưu token mới vào localStorage
3. Retry request ban đầu với token mới
4. Nếu refresh fail → logout user
```

### Ví dụ flow khi token hết hạn
```
1. User gọi API → axiosClient
2. Backend trả 401 UNAUTHORIZED
3. axiosClient tự động gọi refreshTokenApi()
4. Nhận token mới từ backend
5. Lưu token mới
6. Retry request ban đầu
7. Trả kết quả cho user
```

### Lưu ý
- Access token được lưu ở `localStorage.access_token`
- Refresh token được lưu ở Redux store
- Không cần gắn token thủ công vào header
- Không cần xử lý 401 trong component (axiosClient xử lý)

---

## 3. Kết hợp HasPermission + axiosClient

### Ví dụ: Tạo sản phẩm
```tsx
import HasPermission from '@/page/commons/HasPermission';
import { createProduct } from '@/services/productApi';
import type { CreateProductRequest } from '@/types/product';
import { toast } from 'sonner';

export default function CreateProductButton() {
  const handleCreate = async () => {
    try {
      const data: CreateProductRequest = {
        name: 'Laptop',
        price: 1000,
        description: 'High-end laptop'
      };
      
      const res = await createProduct(data);
      toast.success('Tạo sản phẩm thành công');
    } catch (error) {
      toast.error('Lỗi khi tạo sản phẩm');
    }
  };

  return (
    <HasPermission perm="POST /api/products">
      <button onClick={handleCreate}>
        Tạo sản phẩm
      </button>
    </HasPermission>
  );
}
```

### Flow:
1. HasPermission kiểm tra user có quyền `POST /api/products`
2. Nếu có → hiển thị button
3. User click button → gọi `createProduct()`
4. axiosClient tự động gắn token vào request
5. Backend xử lý và trả response
6. Hiển thị toast success/error

---

## 4. Setup ban đầu

### Trong App.tsx hoặc main.tsx
```tsx
import { setupAxiosInterceptors } from '@/lib/axiosClient';
import { useAppDispatch } from '@/features/hooks';
import { useEffect } from 'react';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Setup axios interceptors với dispatch
    setupAxiosInterceptors(dispatch);
  }, [dispatch]);

  return (
    // App content
  );
}
```

---

## 5. Các permission strings phổ biến

### Auth Service
- `POST /api/permissions` - Tạo quyền
- `GET /api/permissions` - Lấy danh sách quyền
- `PUT /api/permissions/{id}` - Cập nhật quyền
- `DELETE /api/permissions/{id}` - Xóa quyền
- `POST /api/users` - Tạo user
- `GET /api/users` - Lấy danh sách user
- `GET /api/users/{id}` - Lấy chi tiết user
- `PUT /api/users` - Cập nhật user
- `DELETE /api/users/{id}` - Xóa user
- `POST /api/roles` - Tạo role
- `GET /api/roles` - Lấy danh sách role
- `PUT /api/roles/{id}` - Cập nhật role
- `DELETE /api/roles/{id}` - Xóa role

### Product Service
- `POST /api/products` - Tạo sản phẩm
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm
- `POST /api/categories` - Tạo danh mục
- `PUT /api/categories/{id}` - Cập nhật danh mục
- `DELETE /api/categories/{id}` - Xóa danh mục

### Cart Service
- `GET /api/carts/my` - Lấy giỏ hàng
- `POST /api/carts/my/items` - Thêm vào giỏ
- `PUT /api/carts/my/items` - Cập nhật giỏ
- `DELETE /api/carts/my/items` - Xóa khỏi giỏ
- `DELETE /api/carts/my` - Xóa toàn bộ giỏ

### Order Service
- `POST /api/orders/checkout` - Checkout tất cả
- `POST /api/orders/checkout-selected` - Checkout chọn lọc
- `GET /api/orders/{orderId}` - Lấy chi tiết đơn
- `POST /api/orders/{orderId}/cancel` - Hủy đơn
- `GET /api/orders/history` - Lịch sử đơn
- `GET /api/orders/status/{status}` - Đơn theo trạng thái
- `GET /api/orders/admin/all` - Tất cả đơn (Admin)

### Inventory Service
- `POST /api/inventory/{productId}` - Tạo kho
- `GET /api/inventory` - Lấy danh sách kho
- `PUT /api/inventory/{productId}` - Cập nhật kho
- `DELETE /api/inventory/{productId}` - Xóa kho

### Payment Service
- `POST /api/payments` - Tạo thanh toán
- `GET /api/payments/callback` - Callback VNPay
- `GET /api/payments/order/{orderId}` - Lấy payment info
