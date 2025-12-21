package com.tranan.paymentservice.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Response chứa thống kê thanh toán/doanh thu cho Dashboard Admin
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentStatsResponse {
    private BigDecimal totalRevenue;

    private List<DailyRevenueDto> dailyRevenue;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyRevenueDto {
        private LocalDate date;
        private String label; // "T1", "T2", ...
        private BigDecimal revenue;
        private long orderCount;
    }
}
