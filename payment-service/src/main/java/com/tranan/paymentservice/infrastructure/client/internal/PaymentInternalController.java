package com.tranan.paymentservice.infrastructure.client.internal;

import com.tranan.paymentservice.annotation.ApiMessage;
import com.tranan.paymentservice.application.dto.response.PaymentResponse;
import com.tranan.paymentservice.application.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/payments")
@RequiredArgsConstructor
public class PaymentInternalController {

    private final PaymentService paymentService;

    /**
     * Internal API: Lấy payment theo orderId
     * GET /internal/payments/order/123
     */

    @ApiMessage("Lấy payment theo orderid")
    @Operation(
            summary = "Lấy payment theo orderid"
    )
    @GetMapping("/order/{orderId}")
    public PaymentResponse getPaymentByOrderId(@PathVariable Long orderId) {
        log.info("[Internal] Getting payment for orderId: {}", orderId);
        return paymentService.getPaymentByOrderId(orderId);
    }
}
