
package com.tranan.inventoryservice.infrastructure.repository.impl;

import com.tranan.inventoryservice.domain.model.Inventory;
import com.tranan.inventoryservice.domain.repository.InventoryRepository;
import com.tranan.inventoryservice.infrastructure.client.dto.InventoryQuantityResponse;
import com.tranan.inventoryservice.infrastructure.entity.InventoryEntity;
import com.tranan.inventoryservice.infrastructure.mapper.InventoryMapper;
import com.tranan.inventoryservice.infrastructure.repository.jpa.InventoryJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * ✅ SỬA: Thêm @RequiredArgsConstructor để inject dependencies
 */
@Repository
@RequiredArgsConstructor // ✅ THÊM annotation này!
public class InventoryRepositoryImpl implements InventoryRepository {

    private final InventoryJpaRepository jpaRepository;
    private final InventoryMapper mapper;

    @Override
    public Inventory save(Inventory inventory) {
        var entity = mapper.toEntity(inventory);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Inventory> findById(Long id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public Optional<Inventory> findByProductId(Long productId) {
        return jpaRepository.findByProductId(productId)
                .map(mapper::toDomain);
    }

    @Override
    public Optional<Inventory> findByProductIdWithLock(Long productId) {
        return jpaRepository.findByProductIdWithLock(productId)
                .map(mapper::toDomain);
    }

    @Override
    public List<Inventory> findByProductIdIn(List<Long> productIds) {
        return jpaRepository.findByProductIdIn(productIds).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Page<Inventory> findAll(Pageable pageable) {
        // 1. Gọi hàm findAll CÓ tham số pageable của JPA -> Trả về
        // Page<InventoryEntity>
        // 2. Dùng .map() của Page để convert từng phần tử sang Domain -> Trả về
        // Page<Inventory>
        return jpaRepository.findAll(pageable)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsByProductId(Long productId) {
        return jpaRepository.existsByProductId(productId);
    }

    @Override
    public void delete(Inventory inventory) {
        var entity = mapper.toEntity(inventory);
        jpaRepository.delete(entity);
    }

    @Override
    public void deleteByProductId(Long productId) {
        jpaRepository.deleteByProductId(productId);
    }

    @Override
    public Page<Inventory> findAllByProductId(Long productId, Pageable pageable) {
        return jpaRepository.findAllByProductId(productId, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<Inventory> findAllByProductIdIn(List<Long> productIds, Pageable pageable) {
        return jpaRepository.findAllByProductIdIn(productIds, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Integer getQuantityByProductId(Long productId) {
        return jpaRepository.findByProductId(productId)
                .map(InventoryEntity::getQuantity)
                .orElse(0);
    }

    @Override
    public List<InventoryQuantityResponse> getQuantitiesByProductIds(List<Long> productIds) {
        return jpaRepository.findByProductIdIn(productIds).stream()
                .map(entity -> new InventoryQuantityResponse(entity.getProductId(), entity.getQuantity()))
                .toList();
    }

    @Override
    public void reduceStockByProductId(Long productId, Integer quantity) {
        jpaRepository.reduceStockByProductId(productId, quantity);
    }

    @Override
    public void restoreStockByProductId(Long productId, Integer quantity) {
        jpaRepository.restoreStockByProductId(productId, quantity);
    }

    @Override
    public long countTotal() {
        return jpaRepository.countTotal();
    }

    @Override
    public long countLowStock() {
        return jpaRepository.countLowStock();
    }

    @Override
    public long countOutOfStock() {
        return jpaRepository.countOutOfStock();
    }

    @Override
    public Page<Inventory> findOutOfStock(Pageable pageable) {
        return jpaRepository.findOutOfStock(pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<Inventory> findLowStock(Pageable pageable) {
        return jpaRepository.findLowStock(pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<Inventory> findInStock(Pageable pageable) {
        return jpaRepository.findInStock(pageable)
                .map(mapper::toDomain);
    }
}