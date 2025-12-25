# Deploy script cho Minikube (Windows PowerShell)
# Chạy script này để deploy toàn bộ hệ thống lên Minikube

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fein-Kafka Minikube Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Kiểm tra Minikube status
Write-Host "`n[1/7] Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = minikube status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Minikube with 8GB RAM and 4 CPUs..." -ForegroundColor Yellow
    minikube start --cpus=4 --memory=8192
} else {
    Write-Host "Minikube is already running" -ForegroundColor Green
}

# 2. Tạo Namespace
Write-Host "`n[2/7] Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml

# 3. Tạo ConfigMap và Secrets
Write-Host "`n[3/7] Creating ConfigMap and Secrets..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 4. Deploy Infrastructure (Databases, Kafka, Redis)
Write-Host "`n[4/7] Deploying infrastructure (databases, kafka, redis)..." -ForegroundColor Yellow
kubectl apply -f k8s/infrastructure/

# Đợi infrastructure sẵn sàng
Write-Host "Waiting for infrastructure to be ready (60s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 5. Deploy Eureka Server trước (Service Discovery)
Write-Host "`n[5/7] Deploying Eureka Server..." -ForegroundColor Yellow
kubectl apply -f k8s/services/eureka-server.yaml

# Đợi Eureka sẵn sàng
Write-Host "Waiting for Eureka Server to be ready (90s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

# 6. Deploy tất cả backend services
Write-Host "`n[6/7] Deploying all backend microservices..." -ForegroundColor Yellow
kubectl apply -f k8s/services/api-gateway.yaml
kubectl apply -f k8s/services/auth-service.yaml
kubectl apply -f k8s/services/product-service.yaml
kubectl apply -f k8s/services/order-service.yaml
kubectl apply -f k8s/services/inventory-service.yaml
kubectl apply -f k8s/services/notification-service.yaml

# Đợi backend services sẵn sàng
Write-Host "Waiting for backend services to be ready (30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 7. Deploy Frontend
Write-Host "`n[7/7] Deploying Frontend (React + Nginx)..." -ForegroundColor Yellow
kubectl apply -f k8s/services/frontend.yaml

# Hiển thị trạng thái
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nChecking pods status:" -ForegroundColor Yellow
kubectl get pods -n fein-kafka

Write-Host "`nChecking services:" -ForegroundColor Yellow
kubectl get svc -n fein-kafka

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Access URLs (NodePort):" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$minikubeIP = minikube ip
Write-Host "Frontend:    http://${minikubeIP}:30000" -ForegroundColor Green
Write-Host "API Gateway: http://${minikubeIP}:30080" -ForegroundColor White
Write-Host "Eureka:      http://${minikubeIP}:30761" -ForegroundColor White
Write-Host "Prometheus:  http://${minikubeIP}:30090" -ForegroundColor White
Write-Host "Grafana:     http://${minikubeIP}:30300" -ForegroundColor White
Write-Host "Kafka UI:    http://${minikubeIP}:30888" -ForegroundColor White
Write-Host "Zipkin:      http://${minikubeIP}:30411" -ForegroundColor White

Write-Host "`nTo open Frontend in browser, run:" -ForegroundColor Yellow
Write-Host "minikube service frontend -n fein-kafka" -ForegroundColor White

Write-Host "`nTo view pod logs:" -ForegroundColor Yellow
Write-Host "kubectl logs -f deployment/<service-name> -n fein-kafka" -ForegroundColor White

