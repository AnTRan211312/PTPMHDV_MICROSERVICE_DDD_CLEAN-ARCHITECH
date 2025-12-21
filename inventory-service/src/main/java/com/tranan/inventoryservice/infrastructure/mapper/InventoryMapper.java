package com.tranan.inventoryservice.infrastructure.mapper;

import com.tranan.inventoryservice.domain.model.Inventory;
import com.tranan.inventoryservice.infrastructure.entity.InventoryEntity;
import org.springframework.stereotype.Component;

/**
 * ✅ SỬA: Không dùng @Builder cho Mapper, map đầy đủ các fields
 */
@Component
public class InventoryMapper {

    /**
     * Convert JPA Entity → Domain Model
     */
    public Inventory toDomain(InventoryEntity entity) {
        if (entity == null) {
            return null;
        }

        return Inventory.builder()
                .id(entity.getId())
                .productId(entity.getProductId())
                .quantity(entity.getQuantity())
                .version(entity.getVersion())
                // ✅ Map audit fields từ BaseEntity
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Convert Domain Model → JPA Entity
     * ✅ QUAN TRỌNG: KHÔNG set createdAt/updatedAt/createdBy/modifiedBy
     * Vì chúng được JPA Auditing tự động quản lý!
     */
    public InventoryEntity toEntity(Inventory domain) {
        if (domain == null) {
            return null;
        }

        // ✅ CHỈ map business fields, KHÔNG map audit fields
        return InventoryEntity.builder()
                .id(domain.getId())
                .productId(domain.getProductId())
                .quantity(domain.getQuantity())
                .version(domain.getVersion())
                // ✅ KHÔNG set createdAt, updatedAt, createdBy, modifiedBy
                // JPA Auditing sẽ tự động set!
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }


}