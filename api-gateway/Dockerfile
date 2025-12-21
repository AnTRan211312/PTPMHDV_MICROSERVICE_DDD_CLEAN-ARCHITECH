# Stage 1: Build stage - Sử dụng image Maven nhỏ để build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

# Thiết lập working directory
WORKDIR /app

# Copy parent POM trước
COPY pom.xml ./pom.xml

# Copy tất cả module POMs để Maven resolve dependencies
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY eureka-server/pom.xml ./eureka-server/pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY product-service/pom.xml ./product-service/pom.xml
COPY order-service/pom.xml ./order-service/pom.xml
COPY inventory-service/pom.xml ./inventory-service/pom.xml
COPY cart-service/pom.xml ./cart-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml
COPY payment-service/pom.xml ./payment-service/pom.xml
COPY monitor-service/pom.xml ./monitor-service/pom.xml

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B -pl api-gateway -am

# Copy source code của service này
COPY api-gateway/src ./api-gateway/src

# Build chỉ service này
RUN mvn clean package -DskipTests -pl api-gateway -am

# Stage 2: Runtime stage - Image nhỏ nhất với JRE
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy JAR từ builder stage
COPY --from=builder /app/api-gateway/target/*.jar app.jar

# Chạy với user non-root để tăng security
RUN addgroup -g 1001 -S javaapp && \
    adduser -S javauser -u 1001 && \
    chown -R javauser:javaapp /app

USER javauser

# Expose ports
EXPOSE 8080 5080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5080/actuator/health || exit 1

CMD ["java", "-jar", "app.jar"]