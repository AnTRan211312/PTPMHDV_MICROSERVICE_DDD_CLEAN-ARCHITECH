# Deploy script cho Minikube (Windows PowerShell)
# Chạy script này để deploy toàn bộ hệ thống lên Minikube

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fein-Kafka Minikube Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Kiểm tra Minikube status
Write-Host "`n[1/6] Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = minikube status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Minikube with 8GB RAM and 4 CPUs..." -ForegroundColor Yellow
    minikube start --cpus=4 --memory=8192
} else {
    Write-Host "Minikube is already running" -ForegroundColor Green
}

# 2. Tạo Namespace
Write-Host "`n[2/6] Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml

# 3. Tạo ConfigMap và Secrets
Write-Host "`n[3/6] Creating ConfigMap and Secrets..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 4. Deploy Infrastructure (Databases, Kafka, Redis)
Write-Host "`n[4/6] Deploying infrastructure (databases, kafka, redis)..." -ForegroundColor Yellow
kubectl apply -f k8s/infrastructure/

# Đợi infrastructure sẵn sàng
Write-Host "Waiting for infrastructure to be ready (60s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 5. Deploy Eureka Server trước (Service Discovery)
Write-Host "`n[5/6] Deploying Eureka Server..." -ForegroundColor Yellow
kubectl apply -f k8s/services/eureka-server.yaml

# Đợi Eureka sẵn sàng
Write-Host "Waiting for Eureka Server to be ready (90s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

# 6. Deploy tất cả services còn lại
Write-Host "`n[6/6] Deploying all microservices..." -ForegroundColor Yellow
kubectl apply -f k8s/services/

# Hiển thị trạng thái
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nChecking pods status:" -ForegroundColor Yellow
kubectl get pods -n fein-kafka

Write-Host "`nChecking services:" -ForegroundColor Yellow
kubectl get svc -n fein-kafka

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Access URLs:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway: " -NoNewline
minikube service api-gateway -n fein-kafka --url 2>$null
Write-Host "Zipkin:      " -NoNewline
minikube service zipkin -n fein-kafka --url 2>$null

Write-Host "`nTo access API Gateway in browser, run:" -ForegroundColor Yellow
Write-Host "minikube service api-gateway -n fein-kafka" -ForegroundColor White

Write-Host "`nTo view all pods logs:" -ForegroundColor Yellow
Write-Host "kubectl logs -f deployment/<service-name> -n fein-kafka" -ForegroundColor White
