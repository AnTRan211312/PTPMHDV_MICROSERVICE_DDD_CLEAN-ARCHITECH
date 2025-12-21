package com.tranan.productservice.infrastructure.mapper;

import com.tranan.productservice.domain.model.Product;
import com.tranan.productservice.domain.model.Review;
import com.tranan.productservice.infrastructure.entity.CategoryEntity;
import com.tranan.productservice.infrastructure.entity.ProductEntity;
import com.tranan.productservice.infrastructure.entity.ReviewEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final ReviewMapper reviewMapper;

    public Product toDomain(ProductEntity entity) {
        if (entity == null) return null;

        // Xử lý Null Safety cho Collections
        List<Review> reviews = (entity.getReviewEntities() == null)
                ? Collections.emptyList()
                : entity.getReviewEntities().stream()
                .map(reviewMapper::toDomain)
                .toList();

        Set<Long> categoryIds = (entity.getCategories() == null)
                ? Collections.emptySet()
                : entity.getCategories().stream()
                .map(CategoryEntity::getId)
                .collect(Collectors.toSet());

        return new Product(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getDiscountPrice(),
                entity.getThumbnail(),
                entity.getImages(),
                reviews,
                entity.getAverageRating(),
                // Xử lý an toàn cho ReviewCount (Long -> int)
                entity.getReviewCount() != null ? entity.getReviewCount().intValue() : 0,
                categoryIds,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Lưu ý: Hàm này chỉ map thông tin cơ bản của Product.
     * Việc map Categories (từ Set<Long> -> Set<CategoryEntity>)
     * nên được thực hiện ở Service Layer vì Mapper không nên inject Repository.
     */
    public ProductEntity toEntity(Product domain) {
        if (domain == null) return null;

        ProductEntity entity = new ProductEntity();
        entity.setId(domain.getId());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setPrice(domain.getPrice());
        entity.setDiscountPrice(domain.getDiscountPrice());
        entity.setThumbnail(domain.getThumbnail());
        entity.setImages(domain.getImages());

        // Map các field tính toán (nếu muốn lưu cứng vào DB)
        entity.setAverageRating(domain.getAverageRating());
        entity.setReviewCount((long) domain.getReviewCount());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());

        // Quan trọng: Không map Categories và Reviews ở đây
        // Vì Domain chỉ giữ ID của Category, không giữ Entity

        return entity;
    }
}