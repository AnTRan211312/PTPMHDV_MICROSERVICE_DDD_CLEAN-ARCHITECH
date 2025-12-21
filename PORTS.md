# Microservices Ports Configuration

## Infrastructure Services

| Service | Container Port | Host Port | URL | Purpose |
|---------|----------------|-----------|-----|---------|
| Zookeeper | 2181 | 2181 | - | Kafka coordination |
| Kafka | 29092 (internal) | 9092 | localhost:9092 | Message broker |
| Kafka UI | 8080 | 8888 | http://localhost:8888 | Kafka monitoring & management |
| Redis | 6379 | 6379 | localhost:6379 | Cache |
| Prometheus | 9090 | 9090 | http://localhost:9090 | Metrics collection |
| Grafana | 3000 | 3000 | http://localhost:3000 | Metrics visualization |
| Zipkin | 9411 | 9411 | http://localhost:9411 | Distributed tracing |

## Databases

| Service | Database | Container Port | Host Port | Credentials |
|---------|----------|----------------|-----------|-------------|
| Product DB | PostgreSQL | 5432 | 5437 | user: postgres / password: password |
| Order DB | PostgreSQL | 5432 | 5433 | user: postgres / password: password |
| Inventory DB | MySQL | 3306 | 3310 | user: root / password: password |
| Cart DB | PostgreSQL | 5432 | 5434 | user: postgres / password: password |
| Auth DB | PostgreSQL | 5432 | 5435 | user: postgres / password: password |
| Notification DB | PostgreSQL | 5432 | 5436 | user: postgres / password: password |
| Payment DB | PostgreSQL | 5432 | 5438 | user: postgres / password: password |

## Microservices

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| API Gateway | 8080 | http://localhost:8080 | Entry point for all requests |
| Auth Service | 8081 | http://localhost:8081 | Authentication & authorization |
| Product Service | 8082 | http://localhost:8082 | Product management |
| Cart Service | 8083 | http://localhost:8083 | Shopping cart management |
| Order Service | 8084 | http://localhost:8084 | Order processing |
| Inventory Service | 8085 | http://localhost:8085 | Inventory management |
| Notification Service | 8086 | http://localhost:8086 | Notifications |
| Payment Service | 8087 | http://localhost:8087 | Payment processing |
| Eureka Server | 8761 | http://localhost:8761 | Service registry |

## Kafka Topics

| Topic | Partitions | Replication Factor | Purpose |
|-------|-----------|-------------------|---------|
| cart-analytics-events | 3 | 1 | Cart analytics events |
| order-events | 3 | 1 | Order events |
| payment-events | 3 | 1 | Payment events |
| order-created | 3 | 1 | Order creation events |
| payment-completed | 3 | 1 | Payment completion events |

## Connection Strings

### From Host Machine
- Kafka: `localhost:9092`
- Redis: `localhost:6379`
- PostgreSQL: `localhost:5437` (Product), `localhost:5433` (Order), etc.
- MySQL: `localhost:3310` (Inventory)

### From Docker Containers (Internal)
- Kafka: `kafka:29092`
- Redis: `redis:6379`
- PostgreSQL: `product-db:5432`, `order-db:5432`, etc.
- MySQL: `inventory-db:3306`
- Eureka: `http://eureka-server:8761`
