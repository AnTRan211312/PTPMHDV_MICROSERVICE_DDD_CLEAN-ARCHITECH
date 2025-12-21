# Kafka Setup Guide for Microservices

## Overview
Kafka được sử dụng cho event-driven architecture trong các microservices:
- **cart-service**: Publish `CartAnalyticsEvent` khi user thêm sản phẩm vào giỏ
- **order-service**: (Sắp tới) Publish order events
- **payment-service**: (Sắp tới) Publish payment events

## Prerequisites
- Kafka 3.x+
- Zookeeper (hoặc KRaft mode)
- Docker (optional, recommended)

## Quick Start with Docker

### 1. Start Kafka & Zookeeper
```bash
docker-compose up -d
```

Hoặc sử dụng docker-compose.yml:
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

### 2. Create Topics
```bash
# Cart Analytics Topic
docker exec kafka kafka-topics --create \
  --topic cart-analytics-events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# Order Events Topic (for order-service)
docker exec kafka kafka-topics --create \
  --topic order-events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# Payment Events Topic (for payment-service)
docker exec kafka kafka-topics --create \
  --topic payment-events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### 3. Verify Topics
```bash
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

## Configuration for Each Service

### Cart Service (Already Configured)
**File**: `cart-service/src/main/resources/application.properties`
```properties
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.producer.acks=1
spring.kafka.producer.retries=3
spring.kafka.producer.batch-size=16384
spring.kafka.producer.linger-ms=10
spring.kafka.producer.buffer-memory=33554432
```

**Kafka Config Class**: `cart-service/src/main/java/com/tranan/cartservice/infrastructure/config/kafka/KafkaProducerConfig.java`

### Order Service (Template for Future)
Copy the same pattern:
1. Create `order-service/src/main/java/com/tranan/orderservice/infrastructure/config/kafka/KafkaProducerConfig.java`
2. Add same properties to `order-service/src/main/resources/application.properties`
3. Create event class: `OrderEvent.java`
4. Inject `KafkaTemplate<String, OrderEvent>` in service

### Payment Service (Template for Future)
Same pattern as Order Service.

## Configuration Parameters Explained

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| `bootstrap-servers` | localhost:9092 | Kafka broker address |
| `acks` | 1 | Leader confirms write (fast, safe) |
| `retries` | 3 | Retry failed sends 3 times |
| `batch-size` | 16384 | Batch size in bytes (16KB) |
| `linger-ms` | 10 | Wait 10ms to batch messages |
| `buffer-memory` | 33554432 | Total buffer memory (32MB) |
| `compression-type` | snappy | Compress messages with Snappy |

## Event Publishing Pattern

### Current Implementation (Cart Service)
```java
// In CartService.addToCart()
kafkaTemplate.send("cart-analytics-events", String.valueOf(userId), event)
    .addCallback(
        result -> log.debug("Event published successfully"),
        ex -> log.error("Failed to publish event", ex)
    );
```

**Key Points:**
- Fire-and-forget: No blocking
- Async callback: Only logs, doesn't block
- Non-critical: Exceptions caught, don't affect UX
- Response time: < 300ms

## Monitoring

### View Messages in Topic
```bash
docker exec kafka kafka-console-consumer \
  --topic cart-analytics-events \
  --bootstrap-server localhost:9092 \
  --from-beginning
```

### Check Consumer Groups
```bash
docker exec kafka kafka-consumer-groups \
  --list \
  --bootstrap-server localhost:9092
```

## Troubleshooting

### Kafka not starting
```bash
docker logs kafka
```

### Topic not created
```bash
docker exec kafka kafka-topics --describe --topic cart-analytics-events --bootstrap-server localhost:9092
```

### Messages not being published
- Check logs: `docker logs cart-service`
- Verify Kafka is running: `docker ps`
- Check bootstrap-servers config

## Production Considerations

1. **Replication Factor**: Use 3 for production
2. **Acks**: Use `all` for critical data
3. **Retries**: Increase for unreliable networks
4. **Monitoring**: Use Kafka Manager or Confluent Control Center
5. **Security**: Enable SSL/TLS and SASL authentication
6. **Partitions**: Scale based on throughput needs

## Next Steps

When implementing order-service and payment-service:
1. Copy `KafkaProducerConfig.java` pattern
2. Create event classes (OrderEvent, PaymentEvent)
3. Add Kafka properties to application.properties
4. Create topics in Kafka
5. Implement event publishing in services
