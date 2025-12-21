package com.tranan.orderservice.domain.repository;

import com.tranan.orderservice.domain.model.Order;
import com.tranan.orderservice.domain.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrderRepository {
    Order save(Order order);

    Optional<Order> findById(Long id);

    int countOrdersByDate(LocalDate date);

    // Lấy danh sách đơn hàng của user
    Page<Order> findByUserId(Long userId, Pageable pageable);

    List<Order> findByUserId(Long userId);

    // Lấy danh sách đơn hàng theo status
    Page<Order> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable);

    // Lấy danh sách đơn hàng theo status (admin)
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    // Lấy tất cả đơn hàng (admin)
    Page<Order> findAll(Pageable pageable);

    // Kiểm tra xem đơn hàng có tồn tại không
    boolean existsById(Long id);

    // Thống kê
    long countTotal();

    long countByStatus(OrderStatus status);

    // Tìm đơn hàng theo status và createdAt trước thời điểm cutoff (đơn hàng quá
    // hạn)
    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, Instant cutoffTime);

    // Tìm kiếm đơn hàng theo orderCode
    Page<Order> searchByOrderCode(String keyword, Pageable pageable);

    // Tìm kiếm đơn hàng theo orderCode và status
    Page<Order> searchByOrderCodeAndStatus(String keyword, OrderStatus status, Pageable pageable);
}
