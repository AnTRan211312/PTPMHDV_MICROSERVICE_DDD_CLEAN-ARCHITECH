package com.tranan.paymentservice.presentation.controller;

import com.tranan.paymentservice.annotation.ApiMessage;
import com.tranan.paymentservice.application.dto.request.CreatePaymentRequest;
import com.tranan.paymentservice.application.dto.response.PaymentCallbackResponse;
import com.tranan.paymentservice.application.dto.response.PaymentResponse;
import com.tranan.paymentservice.application.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Tạo thanh toán cho đơn hàng
     * POST /api/payments?orderId=123
     */
    @PostMapping
    @ApiMessage("Tạo thanh toán")
    @Operation(summary = "Tạo thanh toán")
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestParam Long orderId,
            @RequestBody CreatePaymentRequest request) {
        log.info("Received create payment request for orderId: {}", orderId);
        PaymentResponse response = paymentService.createPayment(orderId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xử lý callback từ VNPay
     * GET
     * /api/payments/callback?vnp_TxnRef=...&vnp_ResponseCode=...&vnp_SecureHash=...
     */
    @ApiMessage("Xử lý callback")
    @Operation(summary = "xử lý call back")
    @GetMapping("/callback")
    public ResponseEntity<PaymentCallbackResponse> handleCallback(@RequestParam Map<String, String> params) {
        log.info("Received VNPay callback");
        PaymentCallbackResponse response = paymentService.handlePaymentCallback(params);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin payment theo orderId
     * GET /api/payments/order/123
     */
    @ApiMessage("Lấy thông tin payment theo id")
    @Operation(summary = "Lấy thông tin payment theo id")
    @PreAuthorize("hasAuthority('GET /api/payments/order/{orderId}')")
    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable Long orderId) {
        log.info("Received get payment request for orderId: {}", orderId);
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thống kê thanh toán/doanh thu (Admin)
     * GET /api/payments/admin/stats
     */
    @ApiMessage("Lấy thống kê doanh thu")
    @Operation(summary = "Lấy thống kê doanh thu (Admin)", description = "Yêu cầu quyền: <b>GET /api/payments/admin/stats</b>. Trả về tổng doanh thu và doanh thu 7 ngày gần nhất.")
    @PreAuthorize("hasAuthority('GET /api/payments/admin/stats')")
    @GetMapping("/admin/stats")
    public ResponseEntity<com.tranan.paymentservice.application.dto.response.PaymentStatsResponse> getPaymentStats() {
        log.info("Received get payment stats request");
        return ResponseEntity.ok(paymentService.getPaymentStats());
    }
}
