package com.tranan.paymentservice.infrastructure.repository.impl;

import com.tranan.paymentservice.domain.model.Payment;
import com.tranan.paymentservice.domain.repository.PaymentRepository;
import com.tranan.paymentservice.infrastructure.entity.PaymentEntity;
import com.tranan.paymentservice.infrastructure.mapper.PaymentMapper;
import com.tranan.paymentservice.infrastructure.repository.jpa.PaymentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class PaymentRepositoryImpl implements PaymentRepository {

    private final PaymentJpaRepository jpaRepository;
    private final PaymentMapper mapper;

    @Override
    public Payment save(Payment payment) {
        PaymentEntity entity = mapper.toEntity(payment);
        PaymentEntity savedEntity = jpaRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Payment> findByOrderId(Long orderId) {
        return jpaRepository.findByOrderId(orderId)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsByOrderId(Long orderId) {
        return jpaRepository.existsByOrderId(orderId);
    }

    @Override
    public BigDecimal getTotalRevenue() {
        BigDecimal total = jpaRepository.sumTotalRevenue();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public List<DailyRevenue> getRevenueByDays(int days) {
        Instant startDate = LocalDate.now().minusDays(days - 1)
                .atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<PaymentEntity> payments = jpaRepository.findCompletedPaymentsSince(startDate);

        // Group by date
        Map<LocalDate, List<PaymentEntity>> groupedByDate = payments.stream()
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate()));

        // Build result for each day
        List<DailyRevenue> result = new ArrayList<>();
        LocalDate current = LocalDate.now().minusDays(days - 1);

        for (int i = 0; i < days; i++) {
            LocalDate date = current.plusDays(i);
            List<PaymentEntity> dayPayments = groupedByDate.getOrDefault(date, Collections.emptyList());

            BigDecimal revenue = dayPayments.stream()
                    .map(PaymentEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(new DailyRevenue(date, revenue, dayPayments.size()));
        }

        return result;
    }
}
