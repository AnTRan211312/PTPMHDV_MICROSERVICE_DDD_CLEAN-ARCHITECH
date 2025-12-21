# Payment Testing Guide - Postman

## Prerequisites

1. Tất cả services đang chạy (auth, order, payment, inventory, cart)
2. Postman cài đặt
3. Có JWT token từ auth service

## Step 1: Lấy JWT Token

**Request:**
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

Lưu `accessToken` để dùng cho các request tiếp theo.

## Step 2: Tạo Product (nếu chưa có)

**Request:**
```
POST http://localhost:8080/api/products
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Laptop Dell XPS 13",
  "description": "High performance laptop",
  "price": 25000000,
  "categoryId": 1,
  "thumbnail": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
}
```

Lưu `productId` từ response.

## Step 3: Thêm Sản Phẩm vào Giỏ Hàng

**Request:**
```
POST http://localhost:8080/api/cart/items
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

## Step 4: Tạo Order (Checkout)

**Request:**
```
POST http://localhost:8080/api/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productIds": [1],
  "shippingAddress": "123 Main St, City",
  "shippingPhone": "0123456789"
}
```

**Response:**
```json
{
  "data": {
    "orderId": 1,
    "userId": 1,
    "status": "PENDING_PAYMENT",
    "totalAmount": 50000000,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "price": 25000000
      }
    ]
  }
}
```

Lưu `orderId` từ response.

## Step 5: Tạo Payment (Tạo URL thanh toán)

**Request:**
```
POST http://localhost:8080/api/payments
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderId": 1,
  "paymentMethod": "VNPAY",
  "returnUrl": "http://localhost:3000/payment-result"
}
```

**Response:**
```json
{
  "data": {
    "paymentId": 1,
    "orderId": 1,
    "status": "PENDING",
    "amount": 50000000,
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5000000000&vnp_TxnRef=1&...",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

## Step 6: Simulate VNPay Callback (Test Success)

VNPay sẽ gọi callback endpoint của bạn. Để test, bạn có 2 cách:

### Cách A: Dùng Mock VNPay (Local Testing)

Nếu bạn enable mock mode trong `payment-service/src/main/resources/application.properties`:
```properties
vnpay.mock.enabled=true
```

Thì bạn có thể test bằng cách gọi mock endpoint:

**Simulate Success:**
```
GET http://localhost:8080/mock-vnpay/paymentv2/vpcpay-success?vnp_TxnRef=1&vnp_Amount=5000000000&vnp_ReturnUrl=http://localhost:3000/payment-result
```

**Simulate Failed:**
```
GET http://localhost:8080/mock-vnpay/paymentv2/vpcpay-failed?vnp_TxnRef=1&vnp_Amount=5000000000&vnp_ReturnUrl=http://localhost:3000/payment-result
```

### Cách B: Manual Callback (Postman)

Gọi callback endpoint trực tiếp:

**Request (Success):**
```
GET http://localhost:8080/api/payments/callback?vnp_TxnRef=1&vnp_Amount=5000000000&vnp_ResponseCode=00&vnp_TransactionNo=VNP123456&vnp_BankCode=NCB&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+1&vnp_PayDate=20250115103000&vnp_SecureHash=SIGNATURE_HERE
```

**Request (Failed):**
```
GET http://localhost:8080/api/payments/callback?vnp_TxnRef=1&vnp_Amount=5000000000&vnp_ResponseCode=99&vnp_TransactionNo=&vnp_BankCode=&vnp_CardType=&vnp_OrderInfo=Payment+for+order+1&vnp_PayDate=20250115103000&vnp_SecureHash=SIGNATURE_HERE
```

**Note:** Bạn cần tính toán `vnp_SecureHash` đúng. Xem phần "Tính HMAC Signature" dưới đây.

## Step 7: Verify Payment Status

**Request:**
```
GET http://localhost:8080/api/payments/order/1
Authorization: Bearer {accessToken}
```

**Response (Success):**
```json
{
  "data": {
    "paymentId": 1,
    "orderId": 1,
    "status": "COMPLETED",
    "amount": 50000000,
    "transactionId": "VNP123456",
    "bankCode": "NCB",
    "cardType": "ATM",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:35:00Z"
  }
}
```

## Step 8: Verify Order Status

**Request:**
```
GET http://localhost:8080/api/orders/1
Authorization: Bearer {accessToken}
```

**Response (After Successful Payment):**
```json
{
  "data": {
    "orderId": 1,
    "userId": 1,
    "status": "PAID",
    "totalAmount": 50000000,
    "items": [...]
  }
}
```

---

## Tính HMAC Signature (Nếu cần)

Nếu bạn muốn test callback với signature hợp lệ, bạn cần tính HMAC SHA512.

### Công thức:

```
signature = HMAC_SHA512(
  "vnp_Amount=5000000000&vnp_BankCode=NCB&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+1&vnp_PayDate=20250115103000&vnp_ResponseCode=00&vnp_TmnCode=YOUR_TMN_CODE&vnp_TransactionNo=VNP123456&vnp_TxnRef=1",
  "YOUR_HASH_SECRET"
)
```

### Dùng Node.js để tính:

```javascript
const crypto = require('crypto');

const hashSecret = "YOUR_HASH_SECRET";
const data = "vnp_Amount=5000000000&vnp_BankCode=NCB&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+1&vnp_PayDate=20250115103000&vnp_ResponseCode=00&vnp_TmnCode=YOUR_TMN_CODE&vnp_TransactionNo=VNP123456&vnp_TxnRef=1";

const signature = crypto
  .createHmac('sha512', hashSecret)
  .update(data)
  .digest('hex');

console.log(signature);
```

### Dùng Python:

```python
import hmac
import hashlib

hash_secret = "YOUR_HASH_SECRET"
data = "vnp_Amount=5000000000&vnp_BankCode=NCB&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+1&vnp_PayDate=20250115103000&vnp_ResponseCode=00&vnp_TmnCode=YOUR_TMN_CODE&vnp_TransactionNo=VNP123456&vnp_TxnRef=1"

signature = hmac.new(
    hash_secret.encode(),
    data.encode(),
    hashlib.sha512
).hexdigest()

print(signature)
```

---

## Postman Collection Template

Bạn có thể import collection này vào Postman:

```json
{
  "info": {
    "name": "Payment Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "2. Create Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"productIds\": [1],\n  \"shippingAddress\": \"123 Main St\",\n  \"shippingPhone\": \"0123456789\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/orders",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "orders"]
        }
      }
    },
    {
      "name": "3. Create Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"orderId\": 1,\n  \"paymentMethod\": \"VNPAY\",\n  \"returnUrl\": \"http://localhost:3000/payment-result\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/payments",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments"]
        }
      }
    },
    {
      "name": "4. Payment Callback (Success)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/payments/callback?vnp_TxnRef=1&vnp_Amount=5000000000&vnp_ResponseCode=00&vnp_TransactionNo=VNP123456&vnp_BankCode=NCB&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+1&vnp_PayDate=20250115103000&vnp_SecureHash=SIGNATURE_HERE",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments", "callback"],
          "query": [
            {
              "key": "vnp_TxnRef",
              "value": "1"
            },
            {
              "key": "vnp_Amount",
              "value": "5000000000"
            },
            {
              "key": "vnp_ResponseCode",
              "value": "00"
            },
            {
              "key": "vnp_TransactionNo",
              "value": "VNP123456"
            },
            {
              "key": "vnp_BankCode",
              "value": "NCB"
            },
            {
              "key": "vnp_CardType",
              "value": "ATM"
            },
            {
              "key": "vnp_OrderInfo",
              "value": "Payment for order 1"
            },
            {
              "key": "vnp_PayDate",
              "value": "20250115103000"
            },
            {
              "key": "vnp_SecureHash",
              "value": "SIGNATURE_HERE"
            }
          ]
        }
      }
    },
    {
      "name": "5. Get Payment Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/payments/order/1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments", "order", "1"]
        }
      }
    },
    {
      "name": "6. Get Order Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/orders/1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "orders", "1"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```

---

## Test Scenarios

### Scenario 1: Successful Payment
1. Login → Lấy token
2. Create Order → Status: PENDING_PAYMENT
3. Create Payment → Lấy paymentUrl
4. Payment Callback (Success) → Status: COMPLETED
5. Verify Order Status → Status: PAID

### Scenario 2: Failed Payment
1. Login → Lấy token
2. Create Order → Status: PENDING_PAYMENT
3. Create Payment → Lấy paymentUrl
4. Payment Callback (Failed) → Status: FAILED
5. Verify Order Status → Status: PENDING_PAYMENT (không thay đổi)
6. Verify Inventory → Stock được restore

### Scenario 3: Invalid Order
1. Create Payment với orderId không tồn tại
2. Expect: 404 OrderNotFoundException

### Scenario 4: Invalid Order Status
1. Create Order → Status: PENDING_PAYMENT
2. Create Payment → Success
3. Create Payment lần 2 với cùng orderId
4. Expect: 400 InvalidOrderStatusException (order không còn PENDING_PAYMENT)

---

## Troubleshooting

### Payment URL không được tạo
- Kiểm tra VNPay config trong `application.properties`
- Kiểm tra Order Service có trả về order không
- Kiểm tra Order status có phải "PENDING_PAYMENT" không

### Callback không được xử lý
- Kiểm tra signature có hợp lệ không
- Kiểm tra Payment status có phải "PENDING" không
- Kiểm tra logs của Payment Service

### Order status không được update
- Kiểm tra Order Service có chạy không
- Kiểm tra Feign client configuration
- Kiểm tra logs của Order Service

### Inventory không được restore
- Kiểm tra Inventory Service có chạy không
- Kiểm tra order items có được truyền đúng không
- Kiểm tra logs của Inventory Service
