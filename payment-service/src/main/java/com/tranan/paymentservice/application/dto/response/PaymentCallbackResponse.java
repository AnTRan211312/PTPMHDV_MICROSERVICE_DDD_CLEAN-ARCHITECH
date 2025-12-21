package com.tranan.paymentservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCallbackResponse {
    private boolean success;
    private String message;
    private Long orderId;
    private String transactionId;
}
