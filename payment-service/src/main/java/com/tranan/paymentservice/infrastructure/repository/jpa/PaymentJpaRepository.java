package com.tranan.paymentservice.infrastructure.repository.jpa;

import com.tranan.paymentservice.infrastructure.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentJpaRepository extends JpaRepository<PaymentEntity, Long> {
    Optional<PaymentEntity> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    // Sum all completed payments
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentEntity p WHERE p.status = 'COMPLETED'")
    BigDecimal sumTotalRevenue();

    // Get payments within date range for daily revenue calculation
    @Query("SELECT p FROM PaymentEntity p WHERE p.status = 'COMPLETED' AND p.createdAt >= :startDate ORDER BY p.createdAt ASC")
    List<PaymentEntity> findCompletedPaymentsSince(@Param("startDate") Instant startDate);
}
