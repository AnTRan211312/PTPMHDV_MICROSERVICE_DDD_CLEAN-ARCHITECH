# Stage 1: Build stage - Sử dụng image Maven nhỏ để build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

# Thiết lập working directory
WORKDIR /app

# Copy chỉ file dependencies trước để cache layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code và build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage - Image nhỏ nhất với JRE
FROM eclipse-temurin:21-jre-alpine

# Thiết lập working directory
WORKDIR /app

# Copy chỉ JAR từ builder stage
COPY --from=builder /app/target/*.jar app.jar

# Chạy với user non-root để tăng security
RUN addgroup -g 1001 -S javaapp && \
    adduser -S javauser -u 1001 && \
    chown -R javauser:javaapp /app

USER javauser

# Expose ports: app port và management port
EXPOSE 8084 5084

# Health check: Check endpoint /actuator/health trên management port, mỗi 30s, timeout 5s, retries 3
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5084/actuator/health || exit 1

# Command để chạy app với profile production
CMD ["java", "-jar", "app.jar"]