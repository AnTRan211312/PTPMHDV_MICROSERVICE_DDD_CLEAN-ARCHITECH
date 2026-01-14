# 🚀 Fein-Kafka Microservices Platform

## 📋 Mục Lục
- [Giới Thiệu](#-giới-thiệu)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt và Chạy Dự Án](#-cài-đặt-và-chạy-dự-án)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Microservices](#-microservices)
- [Infrastructure](#-infrastructure)
- [API Documentation](#-api-documentation)
- [Monitoring & Observability](#-monitoring--observability)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Giới Thiệu

**Fein-Kafka** là một hệ thống microservices e-commerce hoàn chỉnh được xây dựng với Spring Boot 3.5.6 và Spring Cloud 2025.0.0. Dự án này được thiết kế với kiến trúc event-driven sử dụng Apache Kafka, tích hợp đầy đủ các công cụ monitoring, tracing, và service discovery.

### ✨ Tính Năng Chính

- ✅ **Microservices Architecture**: Kiến trúc microservices với 9 services độc lập
- ✅ **Event-Driven**: Giao tiếp bất đồng bộ qua Apache Kafka
- ✅ **Service Discovery**: Sử dụng Netflix Eureka
- ✅ **API Gateway**: Routing và load balancing với Spring Cloud Gateway
- ✅ **Authentication & Authorization**: JWT-based authentication
- ✅ **Distributed Tracing**: Zipkin cho distributed tracing
- ✅ **Monitoring**: Prometheus + Grafana
- ✅ **Caching**: Redis cho caching và session management
- ✅ **Payment Integration**: Tích hợp VNPay payment gateway
- ✅ **Containerization**: Docker & Docker Compose
- ✅ **Orchestration**: Kubernetes deployment ready

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   API Gateway       │ (Port 8080)
│  Spring Cloud GW    │
└─────────┬───────────┘
          │
    ┌─────┴─────┬─────────┬─────────┬─────────┬─────────┐
    ▼           ▼         ▼         ▼         ▼         ▼
┌────────┐ ┌─────────┐ ┌──────┐ ┌───────┐ ┌─────────┐ ┌──────────┐
│  Auth  │ │ Product │ │ Cart │ │ Order │ │Inventory│ │ Payment  │
│Service │ │ Service │ │Service│ │Service│ │ Service │ │ Service  │
└───┬────┘ └────┬────┘ └───┬──┘ └───┬───┘ └────┬────┘ └────┬─────┘
    │           │           │        │          │           │
    └───────────┴───────────┴────────┴──────────┴───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Apache Kafka  │
                    │   (Events)    │
                    └───────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Notification   │
                   │    Service      │
                   └─────────────────┘
```

### 🔄 Event Flow

```
Cart → Add Item → Kafka (cart-analytics-events)
Order → Create → Kafka (order-events) → Inventory (reduce stock)
Payment → Complete → Kafka (payment-events) → Order (update status) → Notification
```

---

## 💻 Công Nghệ Sử Dụng

### Backend Framework
- **Spring Boot**: 3.5.6
- **Spring Cloud**: 2025.0.0
- **Java**: 21
- **Maven**: 3.9+

### Microservices Stack
- **Spring Cloud Gateway**: API Gateway
- **Netflix Eureka**: Service Discovery
- **OpenFeign**: Service-to-service communication
- **Spring Cloud Config**: Centralized configuration (optional)

### Messaging & Events
- **Apache Kafka**: 7.6.0
- **Zookeeper**: 7.5.0

### Databases
- **PostgreSQL**: 17-alpine
  - Product Service
  - Order Service
  - Cart Service
  - Auth Service
  - Notification Service
  - Payment Service
- **MySQL**: 8.4
  - Inventory Service

### Caching
- **Redis**: 7

### Monitoring & Observability
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Zipkin**: Distributed tracing
- **Micrometer**: Application metrics
- **Kafka UI**: Kafka monitoring

### Security
- **Spring Security**: Authentication & Authorization
- **JWT**: Token-based authentication
- **BCrypt**: Password hashing

### Documentation
- **SpringDoc OpenAPI**: 2.8.9
- **Swagger UI**: API documentation

### Deployment
- **Docker**: Containerization
- **Docker Compose**: Local development
- **Kubernetes**: Production orchestration
- **Minikube**: Local K8s development

### Payment Integration
- **VNPay**: Payment gateway

---

## 📦 Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết
- **Java Development Kit (JDK)**: 21 trở lên
- **Maven**: 3.9+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+

### Optional (cho Kubernetes deployment)
- **Kubernetes**: 1.28+
- **kubectl**: 1.28+
- **Minikube**: 1.32+ (cho local K8s)

### Tài Nguyên Hệ Thống Đề Xuất
- **CPU**: 4+ cores
- **RAM**: 16GB+ (cho Docker environment)
- **Disk**: 20GB+ free space
- **OS**: Windows 10/11, macOS, hoặc Linux

---

## 🚀 Cài Đặt và Chạy Dự Án

### 1. Clone Repository

```bash
git clone https://github.com/your-username/fein-kafka.git
cd fein-kafka/fein-kafka
```

### 2. Chạy Infrastructure Services (Docker Compose)

```bash
# Khởi động tất cả infrastructure services
docker-compose up -d

# Kiểm tra services đang chạy
docker-compose ps
```

Sau khi chạy lệnh trên, các services sau sẽ được khởi động:
- ✅ Zookeeper (Port 2181)
- ✅ Kafka (Port 9092)
- ✅ Kafka UI (Port 8888)
- ✅ Redis (Port 6379)
- ✅ PostgreSQL databases (Ports 5433-5438)
- ✅ MySQL (Port 3310)
- ✅ Zipkin (Port 9411)
- ✅ Prometheus (Port 9090)
- ✅ Grafana (Port 3000)

### 3. Khởi Động Microservices

#### Option A: Chạy từng service riêng lẻ

```bash
# 1. Eureka Server (Service Discovery) - PHẢI CHẠY ĐẦU TIÊN
cd eureka-server
mvn spring-boot:run

# 2. API Gateway
cd api-gateway
mvn spring-boot:run

# 3. Auth Service
cd auth-service
mvn spring-boot:run

# 4. Product Service
cd product-service
mvn spring-boot:run

# 5. Cart Service
cd cart-service
mvn spring-boot:run

# 6. Inventory Service
cd inventory-service
mvn spring-boot:run

# 7. Order Service
cd order-service
mvn spring-boot:run

# 8. Payment Service
cd payment-service
mvn spring-boot:run

# 9. Notification Service
cd notification-service
mvn spring-boot:run

# 10. Monitor Service
cd monitor-service
mvn spring-boot:run
```

#### Option B: Build tất cả services

```bash
# Build tất cả services
mvn clean install -DskipTests

# Chạy từng service
java -jar eureka-server/target/eureka-server-0.0.1-SNAPSHOT.jar
java -jar api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar
# ... các services khác
```

### 4. Kiểm Tra Services

Kiểm tra tất cả services đã đăng ký với Eureka:
- **Eureka Dashboard**: http://localhost:8761

Truy cập API Documentation:
- **API Gateway Swagger**: http://localhost:8080/swagger-ui.html
- **Product Service**: http://localhost:8082/swagger-ui.html
- **Cart Service**: http://localhost:8083/swagger-ui.html
- **Order Service**: http://localhost:8084/swagger-ui.html

### 5. Monitoring Tools

- **Kafka UI**: http://localhost:8888 (Quản lý Kafka topics và messages)
- **Zipkin**: http://localhost:9411 (Distributed tracing)
- **Prometheus**: http://localhost:9090 (Metrics)
- **Grafana**: http://localhost:3000 (Visualization - user: admin, password: admin)

---

## 📁 Cấu Trúc Dự Án

```
fein-kafka/
├── api-gateway/                 # Spring Cloud Gateway
├── auth-service/               # Authentication & Authorization service
├── cart-service/               # Shopping cart management
├── eureka-server/             # Netflix Eureka service registry
├── inventory-service/         # Inventory & stock management
├── monitor-service/           # Monitoring & metrics aggregation
├── notification-service/      # Email & notification service
├── order-service/             # Order processing
├── payment-service/           # Payment processing (VNPay)
├── product-service/           # Product catalog management
├── k8s/                       # Kubernetes deployment files
│   ├── infrastructure/        # Infrastructure services (DB, Kafka, etc.)
│   ├── services/             # Microservices deployments
│   ├── configmap.yaml        # ConfigMaps
│   ├── namespace.yaml        # Namespace definition
│   └── secrets.yaml          # Secrets
├── scripts/                   # Deployment scripts
│   └── deploy-minikube.ps1   # Minikube deployment script
├── CSDL/                     # Database documentation
├── docker-compose.yml        # Docker Compose configuration
├── prometheus.yml            # Prometheus configuration
├── pom.xml                   # Parent POM
└── README.md                 # This file
```

---

## 🔧 Microservices

### 1. **API Gateway** (Port 8080)
- **Mô tả**: Entry point cho tất cả client requests
- **Chức năng**:
  - Routing requests đến các microservices
  - Load balancing
  - Rate limiting
  - CORS configuration
- **Công nghệ**: Spring Cloud Gateway, Reactive WebFlux

### 2. **Auth Service** (Port 8081)
- **Mô tả**: Xác thực và phân quyền
- **Chức năng**:
  - User registration & login
  - JWT token generation & validation
  - Role-based access control (RBAC)
  - Session management với Redis
  - Password encryption (BCrypt)
- **Database**: PostgreSQL (Port 5435)
- **API Docs**: [INTERNAL_APIS.md](INTERNAL_APIS.md)

### 3. **Product Service** (Port 8082)
- **Mô tả**: Quản lý danh mục sản phẩm
- **Chức năng**:
  - CRUD operations cho products
  - Product search & filtering
  - Category management
  - Product images (với AWS S3 integration)
- **Database**: PostgreSQL (Port 5437)
- **Cache**: Redis

### 4. **Cart Service** (Port 8083)
- **Mô tả**: Quản lý giỏ hàng
- **Chức năng**:
  - Add/Remove items từ cart
  - Update quantity
  - Calculate total price
  - Publish cart analytics events qua Kafka
- **Database**: PostgreSQL (Port 5434)
- **Kafka Topics**: `cart-analytics-events`
- **Internal APIs**: [INTERNAL_APIS.md#1-cart-service-internal-apis](INTERNAL_APIS.md)

### 5. **Inventory Service** (Port 8085)
- **Mô tả**: Quản lý kho hàng và tồn kho
- **Chức năng**:
  - Stock management
  - Reduce stock khi order được tạo
  - Restore stock khi order bị hủy
  - Stock check và validation
  - Batch operations cho multiple products
- **Database**: MySQL (Port 3310)
- **Internal APIs**: [INTERNAL_APIS.md#3-inventory-service-internal-apis](INTERNAL_APIS.md)
- **Communication**: Feign Client với Order Service, Payment Service

### 6. **Order Service** (Port 8084)
- **Mô tả**: Xử lý đơn hàng
- **Chức năng**:
  - Create orders từ cart
  - Order status management (PENDING, PAID, CANCELLED, SHIPPING, DELIVERED)
  - Order history
  - Integration với Cart Service & Inventory Service
- **Database**: PostgreSQL (Port 5433)
- **Kafka Topics**: `order-events`, `order-created`
- **Internal APIs**: [INTERNAL_APIS.md#2-order-service-internal-apis](INTERNAL_APIS.md)

### 7. **Payment Service** (Port 8087)
- **Mô tả**: Xử lý thanh toán
- **Chức năng**:
  - VNPay payment gateway integration
  - Payment callback handling
  - Update order status sau khi thanh toán
  - Restore inventory nếu payment failed
- **Database**: PostgreSQL (Port 5438)
- **Kafka Topics**: `payment-events`, `payment-completed`
- **External Integration**: VNPay API
- **Documentation**: [PAYMENT_TESTING_GUIDE.md](PAYMENT_TESTING_GUIDE.md), [VNPAY_INTEGRATION_GUIDE.md](VNPAY_INTEGRATION_GUIDE.md)

### 8. **Notification Service** (Port 8086)
- **Mô tả**: Gửi thông báo và email
- **Chức năng**:
  - Email notifications
  - Order status notifications
  - Payment confirmation emails
  - Consume events từ Kafka
- **Database**: PostgreSQL (Port 5436)
- **Kafka Consumer**: Lắng nghe các events từ order và payment

### 9. **Monitor Service**
- **Mô tả**: Monitoring và metrics aggregation
- **Chức năng**:
  - Collect metrics từ các services
  - Expose metrics cho Prometheus
  - Health checks
  - Custom business metrics

### 10. **Eureka Server** (Port 8761)
- **Mô tả**: Service registry và discovery
- **Chức năng**:
  - Service registration
  - Service discovery
  - Health monitoring
  - Load balancing information

---

## 🗄️ Infrastructure

### Databases

| Service | Database | Port | Username | Password |
|---------|----------|------|----------|----------|
| Product | PostgreSQL | 5437 | postgres | password |
| Order | PostgreSQL | 5433 | postgres | password |
| Cart | PostgreSQL | 5434 | postgres | password |
| Auth | PostgreSQL | 5435 | postgres | password |
| Notification | PostgreSQL | 5436 | postgres | password |
| Payment | PostgreSQL | 5438 | postgres | password |
| Inventory | MySQL | 3310 | root | password |

### Messaging (Kafka)

**Kafka Topics:**

| Topic | Partitions | Replication | Purpose |
|-------|-----------|-------------|---------|
| `cart-analytics-events` | 3 | 1 | Cart analytics events |
| `order-events` | 3 | 1 | Order lifecycle events |
| `payment-events` | 3 | 1 | Payment transaction events |
| `order-created` | 3 | 1 | New order notifications |
| `payment-completed` | 3 | 1 | Payment completion events |

**Kafka Configuration:**
- Bootstrap Server: `localhost:9092` (external), `kafka:29092` (internal)
- Zookeeper: `localhost:2181`
- Kafka UI: http://localhost:8888

**Kafka Setup Guide**: [KAFKA_SETUP_GUIDE.md](KAFKA_SETUP_GUIDE.md)

### Caching

**Redis Configuration:**
- Port: 6379
- Password: `password`
- Used by:
  - Auth Service (session management)
  - Product Service (product caching)
  - Cart Service (cart caching)

### Monitoring Stack

- **Prometheus**: http://localhost:9090
  - Scrapes metrics every 15s
  - Configuration: [prometheus.yml](prometheus.yml)
  
- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: `admin`
  - Pre-configured dashboards cho microservices metrics

- **Zipkin**: http://localhost:9411
  - Distributed tracing
  - Request flow visualization
  - Performance analysis

---

## 📚 API Documentation

### Swagger UI (OpenAPI)

Mỗi service đều có Swagger UI riêng:

- **Product Service**: http://localhost:8082/swagger-ui.html
- **Cart Service**: http://localhost:8083/swagger-ui.html
- **Order Service**: http://localhost:8084/swagger-ui.html
- **Inventory Service**: http://localhost:8085/swagger-ui.html
- **Auth Service**: http://localhost:8081/swagger-ui.html
- **Payment Service**: http://localhost:8087/swagger-ui.html
- **Notification Service**: http://localhost:8086/swagger-ui.html

### Internal APIs Documentation

Xem chi tiết các Internal APIs dùng cho inter-service communication:
- [INTERNAL_APIS.md](INTERNAL_APIS.md)

### Ports Configuration

Xem đầy đủ thông tin ports và connection strings:
- [PORTS.md](PORTS.md)

### Sample API Flows

#### 1. User Registration & Login

```bash
# Register
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

# Login
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}

# Response contains JWT token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer"
}
```

#### 2. Product Catalog

```bash
# Get all products
GET http://localhost:8080/api/products

# Get product by ID
GET http://localhost:8080/api/products/1

# Search products
GET http://localhost:8080/api/products/search?keyword=laptop
```

#### 3. Shopping Cart

```bash
# Add item to cart (requires authentication)
POST http://localhost:8080/api/cart/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}

# Get cart
GET http://localhost:8080/api/cart
Authorization: Bearer {token}

# Update quantity
PUT http://localhost:8080/api/cart/items/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}

# Remove item
DELETE http://localhost:8080/api/cart/items/1
Authorization: Bearer {token}
```

#### 4. Order & Checkout

```bash
# Create order from cart
POST http://localhost:8080/api/orders/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "shippingAddress": "123 Main St, City, Country",
  "paymentMethod": "VNPAY"
}

# Get order history
GET http://localhost:8080/api/orders
Authorization: Bearer {token}

# Get order details
GET http://localhost:8080/api/orders/1
Authorization: Bearer {token}
```

#### 5. Payment

```bash
# Create VNPay payment
POST http://localhost:8080/api/payments/vnpay/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 1,
  "amount": 1000000,
  "orderInfo": "Payment for order #1"
}

# Response contains VNPay payment URL
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

---

## 📊 Monitoring & Observability

### 1. Service Health Checks

```bash
# Check if all services are registered with Eureka
curl http://localhost:8761/eureka/apps

# Individual service health
curl http://localhost:8081/actuator/health  # Auth Service
curl http://localhost:8082/actuator/health  # Product Service
curl http://localhost:8083/actuator/health  # Cart Service
```

### 2. Prometheus Metrics

Truy cập Prometheus UI: http://localhost:9090

**Sample Queries:**
```promql
# HTTP request rate
rate(http_server_requests_seconds_count[5m])

# JVM memory usage
jvm_memory_used_bytes

# Kafka consumer lag
kafka_consumer_lag
```

### 3. Grafana Dashboards

Truy cập Grafana: http://localhost:3000 (admin/admin)

**Pre-configured Dashboards:**
- JVM metrics
- HTTP request metrics
- Database connection pools
- Kafka metrics
- Custom business metrics

### 4. Distributed Tracing (Zipkin)

Truy cập Zipkin UI: http://localhost:9411

**Features:**
- Trace request flow across services
- Identify performance bottlenecks
- View service dependencies
- Analyze latency

### 5. Kafka Monitoring

Truy cập Kafka UI: http://localhost:8888

**Features:**
- View topics và partitions
- Monitor messages
- Consumer group monitoring
- Broker status

---

## 🚢 Deployment

### Docker Compose (Development)

```bash
# Start all infrastructure services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (clean start)
docker-compose down -v
```

### Kubernetes (Production)

#### Prerequisites
- Kubernetes cluster (Minikube, GKE, EKS, AKS, etc.)
- kubectl configured

#### Deploy với Minikube

```powershell
# Chạy deployment script (Windows)
.\scripts\deploy-minikube.ps1

# Hoặc deploy thủ công
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/infrastructure/
kubectl apply -f k8s/services/

# Check deployment status
kubectl get pods -n fein-kafka
kubectl get services -n fein-kafka

# Access services (NodePort)
minikube service api-gateway -n fein-kafka
minikube service frontend -n fein-kafka
```

#### Kubernetes Resources

- **Namespace**: `fein-kafka`
- **ConfigMaps**: Environment configuration
- **Secrets**: Database passwords, API keys
- **Deployments**: Microservices deployments
- **Services**: ClusterIP and NodePort services
- **PersistentVolumes**: Database storage

### Environment Variables

Tạo file `.env` cho các services (không commit vào Git):

```bash
# Database
DB_HOST=localhost
DB_PORT=5437
DB_NAME=product_service_db
DB_USERNAME=postgres
DB_PASSWORD=password

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# VNPay (for payment-service)
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/callback
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests for all services
mvn test

# Run tests for specific service
cd product-service
mvn test

# Generate test coverage report
mvn test jacoco:report
```

### Integration Tests

```bash
# Run integration tests
mvn verify

# Skip unit tests, run only integration tests
mvn verify -DskipUnitTests
```

### API Testing (Postman/cURL)

Xem chi tiết tại:
- [PAYMENT_TESTING_GUIDE.md](PAYMENT_TESTING_GUIDE.md) - Hướng dẫn test payment flow
- [INTERNAL_APIS.md](INTERNAL_APIS.md) - Internal API examples

---

## 🔐 Security

### Authentication Flow

1. Client gửi credentials đến Auth Service qua API Gateway
2. Auth Service validate credentials
3. Nếu valid, generate JWT token
4. Client sử dụng token trong `Authorization: Bearer {token}` header
5. API Gateway validate token cho mọi request

### Security Features

- ✅ JWT-based authentication
- ✅ Password encryption với BCrypt
- ✅ Role-based access control (USER, ADMIN)
- ✅ CORS configuration
- ✅ Rate limiting tại API Gateway
- ✅ Secure database connections
- ✅ Secrets management (Kubernetes Secrets, Environment variables)

### Best Practices

- ⚠️ **KHÔNG** commit sensitive data (passwords, API keys) vào Git
- ⚠️ Sử dụng environment variables hoặc Kubernetes Secrets
- ⚠️ Rotate JWT secrets định kỳ
- ⚠️ Enable HTTPS trong production
- ⚠️ Implement API rate limiting
- ⚠️ Regular security audits

---

## 🛠️ Troubleshooting

### Services không kết nối được với Eureka

```bash
# Kiểm tra Eureka Server đã chạy
curl http://localhost:8761/eureka/apps

# Check service logs
docker logs {service-name}

# Verify network connectivity
docker network inspect fein-kafka_microservice-network
```

### Kafka connection issues

```bash
# Check Kafka is running
docker ps | grep kafka

# Verify topics created
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Check Kafka logs
docker logs kafka

# Recreate topics
./scripts/create-kafka-topics.sh
```

### Database connection errors

```bash
# Check database containers
docker ps | grep -E 'postgres|mysql'

# Test database connection
docker exec -it product-db psql -U postgres -d product_service_db

# Reset database
docker-compose down -v
docker-compose up -d
```

### Port conflicts

```bash
# Find process using port
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # macOS/Linux

# Kill process
taskkill /PID {pid} /F        # Windows
kill -9 {pid}                 # macOS/Linux
```

---

## 📈 Performance Optimization

### Caching Strategy

- **Product Service**: Cache popular products trong Redis
- **Cart Service**: Session-based cart caching
- **Auth Service**: JWT token caching
- **TTL**: 1 hour cho product cache, 30 minutes cho cart

### Database Optimization

- Indexes trên foreign keys và frequently queried columns
- Connection pooling (HikariCP)
- Read replicas cho read-heavy services

### Kafka Optimization

- Batch message processing
- Consumer groups cho parallel processing
- Compression (Snappy)
- Partitioning strategy cho high throughput

---

## 🤝 Contributing

### Development Workflow

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards

- Follow Java coding conventions
- Write unit tests cho new features
- Update documentation
- Use meaningful commit messages
- Code review required trước khi merge

### Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Hot fix branches

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors & Contributors

- **Tran An** - Initial work - [GitHub](https://github.com/your-username)

---

## 📞 Contact & Support

- **Email**: your-email@example.com
- **GitHub Issues**: [Issues](https://github.com/your-username/fein-kafka/issues)
- **Documentation**: [Wiki](https://github.com/your-username/fein-kafka/wiki)

---

## 🎓 Learning Resources

### Spring Cloud Microservices
- [Spring Cloud Documentation](https://spring.io/projects/spring-cloud)
- [Netflix OSS](https://netflix.github.io/)

### Kafka
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KAFKA_SETUP_GUIDE.md](KAFKA_SETUP_GUIDE.md)

### Kubernetes
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Guide](https://minikube.sigs.k8s.io/docs/)

### VNPay Integration
- [VNPAY_INTEGRATION_GUIDE.md](VNPAY_INTEGRATION_GUIDE.md)
- [PAYMENT_TESTING_GUIDE.md](PAYMENT_TESTING_GUIDE.md)

---

## 🗺️ Roadmap

### Future Enhancements

- [ ] Implement Circuit Breaker pattern (Resilience4j)
- [ ] Add API versioning
- [ ] Implement CQRS pattern
- [ ] Add GraphQL API
- [ ] Implement Saga pattern cho distributed transactions
- [ ] Add more payment gateways (Stripe, PayPal)
- [ ] Implement real-time notifications (WebSocket)
- [ ] Add search functionality (Elasticsearch)
- [ ] Implement API rate limiting per user
- [ ] Add internationalization (i18n)
- [ ] Implement A/B testing framework
- [ ] Add ML-based product recommendations
- [ ] Implement event sourcing
- [ ] Add multi-tenancy support

---

## 📊 Project Statistics

- **Total Services**: 10 microservices
- **Lines of Code**: ~50,000+
- **Database Tables**: 30+
- **Kafka Topics**: 5
- **API Endpoints**: 100+
- **Test Coverage**: 70%+

---

## ⚡ Quick Links

- [API Documentation](INTERNAL_APIS.md)
- [Ports Configuration](PORTS.md)
- [Kafka Setup](KAFKA_SETUP_GUIDE.md)
- [Payment Testing](PAYMENT_TESTING_GUIDE.md)
- [VNPay Integration](VNPAY_INTEGRATION_GUIDE.md)
- [Eureka Dashboard](http://localhost:8761)
- [Kafka UI](http://localhost:8888)
- [Zipkin](http://localhost:9411)
- [Prometheus](http://localhost:9090)
- [Grafana](http://localhost:3000)

---

**Happy Coding! 🚀**
