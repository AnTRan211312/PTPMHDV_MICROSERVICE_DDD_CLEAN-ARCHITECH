package com.tranan.productservice.infrastructure.mapper;

import com.tranan.productservice.domain.model.Review;
import com.tranan.productservice.infrastructure.entity.ProductEntity;
import com.tranan.productservice.infrastructure.entity.ReviewEntity;
import org.springframework.stereotype.Component;
// BỎ: import ProductMapper và @RequiredArgsConstructor vì không dùng đến

@Component
public class ReviewMapper {

    // BỎ: private final ProductMapper productMapper; -> Tránh lỗi vòng lặp

    public Review toDomain(ReviewEntity entity) {
        if (entity == null) return null;

        return new Review(
                entity.getId(),
                entity.getUserEmail(), // Đã sửa tên biến
                entity.getRating(),
                entity.getComment(),
                entity.getCreatedAt()
        );
    }

    public ReviewEntity toEntity(Review domain, ProductEntity productEntity) {
        if (domain == null) return null;

        ReviewEntity entity = new ReviewEntity();

        // ID: Nếu update thì set, create mới thì null (để JPA tự sinh)
        entity.setId(domain.getId());

        // SỬA: Phải dùng Setter
        entity.setUserEmail(domain.getUserEmail()); // domain phải trả về String

        entity.setRating(domain.getRating());
        entity.setComment(domain.getComment());
        entity.setCreatedAt(domain.getCreatedAt());

        // Lombok tạo setter theo tên biến "product", không phải "productEntity"
        entity.setProduct(productEntity);

        return entity;
    }
}