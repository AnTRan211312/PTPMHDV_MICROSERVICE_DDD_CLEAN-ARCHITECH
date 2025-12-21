package com.tranan.productservice.infrastructure.mapper;

import com.tranan.productservice.domain.model.Category;
import com.tranan.productservice.infrastructure.entity.CategoryEntity;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    /**
     * Entity → Domain (Reconstitution)
     */
    public Category toDomain(CategoryEntity entity) {
        if (entity == null) return null;

        return new Category(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * ✅ Domain → Entity (Persistence)
     * CẦN CHO save() method
     */
    public CategoryEntity toEntity(Category category) {
        if (category == null) return null;

        CategoryEntity entity = new CategoryEntity();
        entity.setId(category.getId());
        entity.setName(category.getName());
        entity.setDescription(category.getDescription());
        entity.setCreatedAt(category.getCreatedAt());
        entity.setUpdatedAt(category.getUpdatedAt());

        return entity;
    }

    /**
     * Helper method - Extract ID từ Entity
     */
    public Long toCategoryId(CategoryEntity entity) {
        return entity != null ? entity.getId() : null;
    }
}