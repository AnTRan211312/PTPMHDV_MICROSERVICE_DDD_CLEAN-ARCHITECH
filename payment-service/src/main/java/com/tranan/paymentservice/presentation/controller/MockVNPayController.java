package com.tranan.paymentservice.presentation.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Mock VNPay controller for local testing
 * Enable with: vnpay.mock.enabled=true
 */
@Slf4j
@Controller
@RequestMapping("/mock-vnpay")
@ConditionalOnProperty(name = "vnpay.mock.enabled", havingValue = "true")
public class MockVNPayController {

    /**
     * Mock VNPay payment page
     * Simulates VNPay payment gateway
     */
    @GetMapping("/paymentv2/vpcpay.html")
    public String mockPaymentPage(
            @RequestParam String vnp_TxnRef,
            @RequestParam String vnp_Amount,
            @RequestParam String vnp_OrderInfo,
            @RequestParam String vnp_ReturnUrl,
            @RequestParam(required = false) String vnp_BankCode,
            Map<String, Object> model) {

        log.info("Mock VNPay Payment Page - Order: {}, Amount: {}", vnp_TxnRef, vnp_Amount);

        model.put("vnp_TxnRef", vnp_TxnRef);
        model.put("vnp_Amount", vnp_Amount);
        model.put("vnp_OrderInfo", vnp_OrderInfo);
        model.put("vnp_ReturnUrl", vnp_ReturnUrl);
        model.put("vnp_BankCode", vnp_BankCode != null ? vnp_BankCode : "NCB");

        return "mock-vnpay-payment";
    }

    /**
     * Mock VNPay callback endpoint
     * Simulates successful payment
     */
    @GetMapping("/paymentv2/vpcpay-success")
    public String mockPaymentSuccess(
            @RequestParam String vnp_TxnRef,
            @RequestParam String vnp_Amount,
            @RequestParam String vnp_ReturnUrl,
            @RequestParam(required = false, defaultValue = "00") String vnp_ResponseCode) {

        log.info("Mock VNPay Success - Order: {}, ResponseCode: {}", vnp_TxnRef, vnp_ResponseCode);

        // Build callback parameters
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", vnp_TxnRef);
        params.put("vnp_Amount", vnp_Amount);
        params.put("vnp_ResponseCode", vnp_ResponseCode);
        params.put("vnp_TransactionNo", "VNP" + System.currentTimeMillis());
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_CardType", "ATM");
        params.put("vnp_OrderInfo", "Payment for order " + vnp_TxnRef);
        params.put("vnp_PayDate", String.valueOf(System.currentTimeMillis() / 1000));

        // Build return URL with callback parameters
        StringBuilder returnUrl = new StringBuilder(vnp_ReturnUrl);
        returnUrl.append("?");
        params.forEach((key, value) -> returnUrl.append(key).append("=").append(value).append("&"));

        log.info("Redirecting to: {}", returnUrl);
        return "redirect:" + returnUrl.toString();
    }

    /**
     * Mock VNPay callback endpoint
     * Simulates failed payment
     */
    @GetMapping("/paymentv2/vpcpay-failed")
    public String mockPaymentFailed(
            @RequestParam String vnp_TxnRef,
            @RequestParam String vnp_Amount,
            @RequestParam String vnp_ReturnUrl) {

        log.info("Mock VNPay Failed - Order: {}", vnp_TxnRef);

        // Build callback parameters with failure code
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", vnp_TxnRef);
        params.put("vnp_Amount", vnp_Amount);
        params.put("vnp_ResponseCode", "99"); // Failed code
        params.put("vnp_TransactionNo", "");
        params.put("vnp_BankCode", "");
        params.put("vnp_CardType", "");
        params.put("vnp_OrderInfo", "Payment for order " + vnp_TxnRef);
        params.put("vnp_PayDate", String.valueOf(System.currentTimeMillis() / 1000));

        // Build return URL with callback parameters
        StringBuilder returnUrl = new StringBuilder(vnp_ReturnUrl);
        returnUrl.append("?");
        params.forEach((key, value) -> returnUrl.append(key).append("=").append(value).append("&"));

        log.info("Redirecting to: {}", returnUrl);
        return "redirect:" + returnUrl.toString();
    }
}
