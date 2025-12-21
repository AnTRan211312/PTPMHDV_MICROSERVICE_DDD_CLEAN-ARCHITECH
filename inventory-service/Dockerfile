# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy parent POM và tất cả module POMs
COPY pom.xml ./pom.xml
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

# Download dependencies
RUN mvn dependency:go-offline -B -pl inventory-service -am

# Copy source code
COPY inventory-service/src ./inventory-service/src

# Build
RUN mvn clean package -DskipTests -pl inventory-service -am

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/inventory-service/target/*.jar app.jar

RUN addgroup -g 1001 -S javaapp && \
    adduser -S javauser -u 1001 && \
    chown -R javauser:javaapp /app

USER javauser

EXPOSE 8083 5083

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5083/actuator/health || exit 1

CMD ["java", "-jar", "app.jar"]