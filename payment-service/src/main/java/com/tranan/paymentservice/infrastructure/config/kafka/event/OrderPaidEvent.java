package com.tranan.paymentservice.infrastructure.config.kafka.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaidEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("eventType")
    private String eventType; // "ORDER_PAID"

    @JsonProperty("orderId")
    private Long orderId;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("paymentId")
    private Long paymentId;

    @JsonProperty("totalAmount")
    private BigDecimal totalAmount;

    @JsonProperty("timestamp")
    private Instant timestamp;
}
