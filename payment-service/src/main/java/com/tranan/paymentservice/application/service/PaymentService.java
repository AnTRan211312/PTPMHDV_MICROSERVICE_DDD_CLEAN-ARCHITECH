package com.tranan.paymentservice.application.service;

import com.tranan.paymentservice.application.dto.request.CreatePaymentRequest;
import com.tranan.paymentservice.application.dto.response.PaymentCallbackResponse;
import com.tranan.paymentservice.application.dto.response.PaymentResponse;
import com.tranan.paymentservice.domain.model.Payment;
import com.tranan.paymentservice.domain.repository.PaymentRepository;
import com.tranan.paymentservice.infrastructure.client.client.InventoryServiceClient;
import com.tranan.paymentservice.infrastructure.client.client.OrderServiceClient;
import com.tranan.paymentservice.infrastructure.client.dto.OrderResponse;
import com.tranan.paymentservice.infrastructure.client.dto.RestoreStockRequest;
import com.tranan.paymentservice.infrastructure.client.dto.UpdateOrderStatusRequest;
import com.tranan.paymentservice.infrastructure.vnpay.VNPayConfig;
import com.tranan.paymentservice.infrastructure.config.kafka.event.PaymentEvent;
import com.tranan.paymentservice.infrastructure.vnpay.VNPayUtil;
import com.tranan.paymentservice.presentation.advice.exception.*;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderServiceClient orderServiceClient;
    private final InventoryServiceClient inventoryServiceClient;
    private final VNPayConfig vnPayConfig;
    private final KafkaTemplate<String, PaymentEvent> paymentEventKafkaTemplate;

    /**
     * Tạo thanh toán và generate VNPay payment URL
     */
    @Transactional
    public PaymentResponse createPayment(Long orderId, CreatePaymentRequest request) {
        log.info("[PaymentService] Creating payment for orderId: {}", orderId);

        // 1. Gọi Order Service để lấy thông tin đơn hàng
        OrderResponse order;
        try {
            order = orderServiceClient.getOrderById(orderId);
            log.info("[PaymentService] Retrieved order {} with status: {}", orderId, order.getStatus());
        } catch (FeignException.NotFound e) {
            log.error("[PaymentService] Order not found: {}", orderId);
            throw new OrderNotFoundException("Order not found with id: " + orderId);
        } catch (Exception e) {
            log.error("[PaymentService] Failed to get order {}: {}", orderId, e.getMessage());
            throw new ServiceCommunicationException("Order Service", e.getMessage());
        }

        // 2. Validate order status phải là PENDING_PAYMENT
        if (!"PENDING_PAYMENT".equals(order.getStatus())) {
            log.error("[PaymentService] Invalid order status: {} for orderId: {}", order.getStatus(), orderId);
            throw new InvalidOrderStatusException("Order is not in PENDING_PAYMENT status");
        }

        // 3. Kiểm tra xem Payment đã tồn tại chưa
        Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderId(orderId);
        Payment payment;

        if (existingPaymentOpt.isPresent()) {
            payment = existingPaymentOpt.get();
            log.info("[PaymentService] Found existing payment {} for orderId: {}", payment.getId(), orderId);

            if ("COMPLETED".equals(payment.getStatus())) {
                throw new IllegalStateException("Order " + orderId + " is already paid");
            }

            // Reuse/reset existing payment
            payment.setStatus("PENDING");
            payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "VNPAY");
            payment.setUpdatedAt(Instant.now());
            // Update amount if needed, though usually fixed at order creation
            payment.setAmount(order.getTotalAmount());

            payment = paymentRepository.save(payment);
            log.info("[PaymentService] Updated existing payment {} for retry", payment.getId());
        } else {
            // Create new payment
            payment = Payment.builder()
                    .orderId(orderId)
                    .userId(order.getUserId())
                    .amount(order.getTotalAmount())
                    .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "VNPAY")
                    .status("PENDING")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            payment = paymentRepository.save(payment);
            log.info("[PaymentService] Created new payment with id: {} for orderId: {}", payment.getId(), orderId);
        }

        // 4. Generate VNPay payment URL
        String paymentUrl = generateVNPayURL(payment, order, request.getReturnUrl());
        log.info("[PaymentService] Generated VNPay URL for payment: {}", payment.getId());

        // 5. Trả về PaymentResponse
        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .paymentUrl(paymentUrl)
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    /**
     * Generate VNPay payment URL với signature
     */
    private String generateVNPayURL(Payment payment, OrderResponse order, String customReturnUrl) {
        Map<String, String> vnpParams = new HashMap<>();

        // VNPay required parameters
        vnpParams.put("vnp_Version", vnPayConfig.getVersion());
        vnpParams.put("vnp_Command", vnPayConfig.getCommand());
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());

        // Amount (VNPay yêu cầu nhân 100, không có decimal)
        long amountInVND = payment.getAmount().multiply(new BigDecimal("100")).longValue();
        vnpParams.put("vnp_Amount", String.valueOf(amountInVND));

        vnpParams.put("vnp_CurrCode", "VND");
        // Mỗi lần tạo URL thanh toán nên có một TxnRef duy nhất để tránh lỗi "Giao dịch
        // đã tồn tại" từ VNPay
        String vnpTxnRef = payment.getOrderId() + "_" + VNPayUtil.getRandomNumber(8);
        vnpParams.put("vnp_TxnRef", vnpTxnRef); // orderId_uniqueSuffix
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getOrderCode());
        vnpParams.put("vnp_OrderType", vnPayConfig.getOrderType());
        vnpParams.put("vnp_Locale", "vn");

        // Return URL
        String returnUrl = customReturnUrl != null ? customReturnUrl : vnPayConfig.getReturnUrl();
        vnpParams.put("vnp_ReturnUrl", returnUrl);

        // IP Address (giả định, trong thực tế lấy từ request)
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

        // Create date (yyyyMMddHHmmss)
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String createDate = formatter.format(new Date());
        vnpParams.put("vnp_CreateDate", createDate);

        // Calculate signature
        String signatureHash = VNPayUtil.hashAllFields(vnpParams, vnPayConfig.getHashSecret());
        vnpParams.put("vnp_SecureHash", signatureHash);

        // Build payment URL
        return VNPayUtil.getPaymentURL(vnpParams, vnPayConfig.getUrl());
    }

    /**
     * Xử lý callback từ VNPay
     */
    @Transactional
    public PaymentCallbackResponse handlePaymentCallback(Map<String, String> params) {
        log.info("[PaymentService] Received callback from VNPay");

        // 1. Verify signature
        String vnpSecureHash = params.get("vnp_SecureHash");
        if (vnpSecureHash == null) {
            log.error("[PaymentService] Missing vnp_SecureHash in callback");
            throw new InvalidSignatureException("Invalid VNPay signature");
        }

        // Remove signature from params for verification
        Map<String, String> paramsToVerify = new HashMap<>(params);
        paramsToVerify.remove("vnp_SecureHash");
        paramsToVerify.remove("vnp_SecureHashType");

        // Calculate expected signature
        String calculatedHash = VNPayUtil.hashAllFields(paramsToVerify, vnPayConfig.getHashSecret());

        // Verify signature
        if (!calculatedHash.equals(vnpSecureHash)) {
            log.warn("[PaymentService] Security: Invalid VNPay signature detected");
            throw new InvalidSignatureException("Invalid VNPay signature");
        }

        log.info("[PaymentService] VNPay signature verified successfully");

        // 2. Extract callback parameters
        String vnpTxnRefRaw = params.get("vnp_TxnRef"); // format: orderId_uniqueSuffix
        String vnpResponseCode = params.get("vnp_ResponseCode");
        String vnpTransactionNo = params.get("vnp_TransactionNo");
        String vnpBankCode = params.get("vnp_BankCode");
        String vnpCardType = params.get("vnp_CardType");

        // Tách lấy orderId từ vnp_TxnRef
        Long orderId = Long.parseLong(vnpTxnRefRaw.split("_")[0]);
        log.info("[PaymentService] Processing callback for orderId: {}, responseCode: {}", orderId, vnpResponseCode);

        // 3. Find payment by orderId
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for order: " + orderId));

        // 4. Process based on response code
        if ("00".equals(vnpResponseCode)) {
            // SUCCESS FLOW
            return handleSuccessfulPayment(payment, vnpTransactionNo, vnpBankCode, vnpCardType, orderId);
        } else {
            // FAILURE FLOW
            return handleFailedPayment(payment, vnpResponseCode, orderId);
        }
    }

    /**
     * Xử lý thanh toán thành công
     */
    private PaymentCallbackResponse handleSuccessfulPayment(Payment payment, String transactionId,
            String bankCode, String cardType, Long orderId) {
        log.info("[PaymentService] Processing successful payment for orderId: {}", orderId);

        // 1. Update payment status to COMPLETED
        payment.markAsCompleted(transactionId);
        payment.setBankCode(bankCode);
        payment.setCardType(cardType);
        paymentRepository.save(payment);
        log.info("[PaymentService] Payment {} marked as COMPLETED, transactionId: {}", payment.getId(), transactionId);

        // 2. Update order status to PAID (ignore if already PAID from Kafka event)
        try {
            orderServiceClient.updateOrderStatus(orderId, UpdateOrderStatusRequest.builder()
                    .status("PAID")
                    .build());
            log.info("[PaymentService] Order {} status updated to PAID", orderId);
        } catch (Exception e) {
            // Check if error is because order is already PAID (from Kafka event listener)
            if (e.getMessage() != null && e.getMessage().contains("Đã thanh toán")) {
                log.info("[PaymentService] Order {} is already PAID, skipping status update", orderId);
            } else {
                log.error("[PaymentService] Failed to update order status: {}", e.getMessage());
                // Don't throw - payment was successful, we'll let Kafka handle order status
                log.warn("[PaymentService] Proceeding with callback response - Kafka will handle order status");
            }
        }

        // 3. Publish PaymentEvent to notification-service and order-service
        publishPaymentEvent(payment, "PAYMENT_COMPLETED");

        return PaymentCallbackResponse.builder()
                .success(true)
                .message("Payment completed successfully")
                .orderId(orderId)
                .transactionId(transactionId)
                .build();
    }

    /**
     * Xử lý thanh toán thất bại
     */
    private PaymentCallbackResponse handleFailedPayment(Payment payment, String responseCode, Long orderId) {
        log.info("[PaymentService] Processing failed payment for orderId: {}, responseCode: {}", orderId, responseCode);

        // 1. Update payment status to FAILED
        payment.markAsFailed();
        paymentRepository.save(payment);
        log.info("[PaymentService] Payment {} marked as FAILED", payment.getId());

        // 2. Get order details to restore inventory
        OrderResponse order;
        try {
            order = orderServiceClient.getOrderById(orderId);
        } catch (Exception e) {
            log.error("[PaymentService] Failed to get order for inventory restoration: {}", e.getMessage());
            throw new ServiceCommunicationException("Order Service", e.getMessage());
        }

        // 3. Restore inventory for all items
        List<RestoreStockRequest> requests = order.getItems().stream()
                .map(item -> RestoreStockRequest.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        try {
            inventoryServiceClient.restoreMultipleStock(requests);
            log.info("[PaymentService] Restored inventory for {} products", requests.size());
        } catch (Exception e) {
            log.error("[PaymentService] Failed to restore inventory: {}", e.getMessage());
            throw new ServiceCommunicationException("Inventory Service", e.getMessage());
        }

        // 4. Publish PaymentEvent to notification-service
        publishPaymentEvent(payment, "PAYMENT_FAILED");

        return PaymentCallbackResponse.builder()
                .success(false)
                .message("Payment failed with code: " + responseCode)
                .orderId(orderId)
                .transactionId(null)
                .build();
    }

    /**
     * Publish PaymentEvent to notification-service (async)
     */
    private void publishPaymentEvent(Payment payment, String eventType) {
        try {
            PaymentEvent event = PaymentEvent.builder()
                    .eventType(eventType)
                    .paymentId(payment.getId())
                    .orderId(payment.getOrderId())
                    .userId(payment.getUserId())
                    .amount(payment.getAmount())
                    .status(payment.getStatus())
                    .timestamp(Instant.now())
                    .build();

            paymentEventKafkaTemplate.send("payment-events", String.valueOf(payment.getOrderId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.info("[PaymentService] Published PaymentEvent (type: {}) for orderId: {}",
                                    eventType, payment.getOrderId());
                        } else {
                            log.error("[PaymentService] Failed to publish PaymentEvent for orderId: {}",
                                    payment.getOrderId(), ex);
                        }
                    });
        } catch (Exception e) {
            // Log error but don't throw exception - event publishing failure should not
            // rollback transaction
            log.error("[PaymentService] Error publishing PaymentEvent for orderId: {}", payment.getOrderId(), e);
        }
    }

    /**
     * Lấy payment theo orderId
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        log.info("[PaymentService] Getting payment for orderId: {}", orderId);

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for order: " + orderId));

        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .paymentUrl(null) // URL không cần thiết khi query
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    // =========================================================================
    // DASHBOARD STATISTICS (Admin API)
    // =========================================================================

    /**
     * Lấy thống kê thanh toán/doanh thu cho Dashboard Admin
     */
    @Transactional(readOnly = true)
    public com.tranan.paymentservice.application.dto.response.PaymentStatsResponse getPaymentStats() {
        log.info("[PaymentService] Getting payment statistics for dashboard");

        java.math.BigDecimal totalRevenue = paymentRepository.getTotalRevenue();

        // Lấy doanh thu 7 ngày gần nhất
        java.util.List<com.tranan.paymentservice.domain.repository.PaymentRepository.DailyRevenue> dailyRevenueList = paymentRepository
                .getRevenueByDays(7);

        java.util.List<com.tranan.paymentservice.application.dto.response.PaymentStatsResponse.DailyRevenueDto> dailyRevenueDtos = dailyRevenueList
                .stream()
                .map(dr -> com.tranan.paymentservice.application.dto.response.PaymentStatsResponse.DailyRevenueDto
                        .builder()
                        .date(dr.date())
                        .label("T" + dr.date().getDayOfWeek().getValue()) // T1-T7
                        .revenue(dr.revenue())
                        .orderCount(dr.orderCount())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return com.tranan.paymentservice.application.dto.response.PaymentStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .dailyRevenue(dailyRevenueDtos)
                .build();
    }
}
