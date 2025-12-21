package com.tranan.inventoryservice.infrastructure.repository.jpa;

import com.tranan.inventoryservice.infrastructure.entity.InventoryEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ✅ SỬA: Thêm TẤT CẢ các custom query methods
 */
@Repository
public interface InventoryJpaRepository extends
        JpaRepository<InventoryEntity, Long>,
        JpaSpecificationExecutor<InventoryEntity> {

    // ✅ THÊM: Tìm theo productId
    Optional<InventoryEntity> findByProductId(Long productId);

    // ✅ THÊM: Tìm theo productId với Pessimistic Lock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryEntity i WHERE i.productId = :productId")
    Optional<InventoryEntity> findByProductIdWithLock(@Param("productId") Long productId);

    // ✅ THÊM: Tìm nhiều products
    List<InventoryEntity> findByProductIdIn(List<Long> productIds);

    // ✅ THÊM: Check tồn tại
    boolean existsByProductId(Long productId);

    // ✅ THÊM: Xóa theo productId
    @Modifying
    @Query("DELETE FROM InventoryEntity i WHERE i.productId = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    // ✅ THÊM: Pagination (nếu cần)
    Page<InventoryEntity> findAllByProductId(Long productId, Pageable pageable);

    // ✅ THÊM: Pagination theo danh sách productIds
    Page<InventoryEntity> findAllByProductIdIn(List<Long> productIds, Pageable pageable);

    // ✅ THÊM: Batch reduce stock (FIX N+1)
    @Modifying
    @Query("UPDATE InventoryEntity i SET i.quantity = i.quantity - :quantity WHERE i.productId = :productId")
    void reduceStockByProductId(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    // ✅ THÊM: Batch restore stock (FIX N+1)
    @Modifying
    @Query("UPDATE InventoryEntity i SET i.quantity = i.quantity + :quantity WHERE i.productId = :productId")
    void restoreStockByProductId(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    // ✅ THÊM: Thống kê - Đếm sản phẩm sắp hết hàng (0 < quantity < 10)
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.quantity > 0 AND i.quantity < 10")
    long countLowStock();

    // ✅ THÊM: Thống kê - Đếm sản phẩm hết hàng (quantity = 0)
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.quantity = 0")
    long countOutOfStock();

    // ✅ THÊM: Đếm tổng số sản phẩm
    @Query("SELECT COUNT(i) FROM InventoryEntity i")
    long countTotal();

    // ✅ LỌC THEO TRẠNG THÁI TỒN KHO
    // Hết hàng (quantity = 0)
    @Query("SELECT i FROM InventoryEntity i WHERE i.quantity = 0")
    Page<InventoryEntity> findOutOfStock(Pageable pageable);

    // Sắp hết hàng (0 < quantity < 10)
    @Query("SELECT i FROM InventoryEntity i WHERE i.quantity > 0 AND i.quantity < 10")
    Page<InventoryEntity> findLowStock(Pageable pageable);

    // Còn hàng (quantity >= 10)
    @Query("SELECT i FROM InventoryEntity i WHERE i.quantity >= 10")
    Page<InventoryEntity> findInStock(Pageable pageable);
}