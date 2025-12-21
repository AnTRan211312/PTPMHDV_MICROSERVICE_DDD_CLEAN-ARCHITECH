package com.tranan.inventoryservice.domain.repository;

import com.tranan.inventoryservice.domain.model.Inventory;
import com.tranan.inventoryservice.infrastructure.client.dto.InventoryQuantityResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Repository Interface - Định nghĩa contract
 * Implementation ở Infrastructure layer
 */
public interface InventoryRepository {

    Inventory save(Inventory inventory);

    Optional<Inventory> findById(Long id);

    Optional<Inventory> findByProductId(Long productId);

    Optional<Inventory> findByProductIdWithLock(Long productId);

    List<Inventory> findByProductIdIn(List<Long> productIds);

    Page<Inventory> findAll(Pageable pageable);

    boolean existsByProductId(Long productId);

    void delete(Inventory inventory);

    void deleteByProductId(Long productId);

    Page<Inventory> findAllByProductId(Long productId, Pageable pageable);

    Page<Inventory> findAllByProductIdIn(List<Long> productIds, Pageable pageable);

    Integer getQuantityByProductId(Long productId);

    List<InventoryQuantityResponse> getQuantitiesByProductIds(List<Long> productIds);

    void reduceStockByProductId(Long productId, Integer quantity);

    void restoreStockByProductId(Long productId, Integer quantity);

    // Thống kê
    long countTotal();

    long countLowStock();

    long countOutOfStock();

    // Lọc theo trạng thái tồn kho
    Page<Inventory> findOutOfStock(Pageable pageable);

    Page<Inventory> findLowStock(Pageable pageable);

    Page<Inventory> findInStock(Pageable pageable);
}