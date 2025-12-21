package com.tranan.paymentservice.domain.repository;

import com.tranan.paymentservice.domain.model.Payment;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository {
    Payment save(Payment payment);

    Optional<Payment> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    // Dashboard Statistics
    BigDecimal getTotalRevenue();

    // Lấy doanh thu theo từng ngày trong n ngày gần nhất
    List<DailyRevenue> getRevenueByDays(int days);

    record DailyRevenue(java.time.LocalDate date, BigDecimal revenue, long orderCount) {
    }
}
