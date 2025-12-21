package com.tranan.orderservice.infrastructure.repository.jpa;

import com.tranan.orderservice.domain.model.OrderStatus;
import com.tranan.orderservice.infrastructure.entity.OrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface OrderJpaRepository extends JpaRepository<OrderEntity, Long> {

    @Query("SELECT COUNT(o) FROM OrderEntity o WHERE o.createdAt >= :startOfDay AND o.createdAt < :endOfDay")
    int countOrdersByDateRange(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    // Lấy danh sách đơn hàng của user (sắp xếp theo ngày tạo mới nhất)
    Page<OrderEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Lấy tất cả đơn hàng của user (không phân trang)
    List<OrderEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Lấy danh sách đơn hàng theo status
    Page<OrderEntity> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, OrderStatus status, Pageable pageable);

    // Alias methods for consistency
    default Page<OrderEntity> findByUserId(Long userId, Pageable pageable) {
        return findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    default List<OrderEntity> findByUserId(Long userId) {
        return findByUserIdOrderByCreatedAtDesc(userId);
    }

    default Page<OrderEntity> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable) {
        return findByUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable);
    }

    // Lấy danh sách đơn hàng theo status (Admin - tất cả users)
    Page<OrderEntity> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    default Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable) {
        return findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    // ✅ Thống kê đơn hàng theo trạng thái
    @Query("SELECT COUNT(o) FROM OrderEntity o")
    long countTotal();

    @Query("SELECT COUNT(o) FROM OrderEntity o WHERE o.status = :status")
    long countByStatus(@Param("status") OrderStatus status);

    // ✅ Tìm đơn hàng PENDING_PAYMENT quá hạn (createdAt trước thời điểm cutoff)
    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND o.createdAt < :cutoffTime")
    List<OrderEntity> findByStatusAndCreatedAtBefore(
            @Param("status") OrderStatus status,
            @Param("cutoffTime") Instant cutoffTime);

    // ✅ Lấy tất cả đơn hàng (Admin) - sắp xếp theo ngày tạo mới nhất
    Page<OrderEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ✅ Tìm kiếm đơn hàng theo orderCode (Admin)
    @Query("SELECT o FROM OrderEntity o WHERE LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY o.createdAt DESC")
    Page<OrderEntity> searchByOrderCode(@Param("keyword") String keyword, Pageable pageable);

    // ✅ Tìm kiếm đơn hàng theo orderCode và status (Admin)
    @Query("SELECT o FROM OrderEntity o WHERE LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%')) AND o.status = :status ORDER BY o.createdAt DESC")
    Page<OrderEntity> searchByOrderCodeAndStatus(
            @Param("keyword") String keyword,
            @Param("status") OrderStatus status,
            Pageable pageable);
}
