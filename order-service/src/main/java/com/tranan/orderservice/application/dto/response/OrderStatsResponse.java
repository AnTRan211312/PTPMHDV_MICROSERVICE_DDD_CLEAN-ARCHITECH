package com.tranan.orderservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderStatsResponse {
    private long total;
    private long pendingPayment;
    private long paid;
    private long shipping;
    private long delivered;
    private long completed;
    private long cancelled;
}
