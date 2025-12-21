package com.tranan.productservice.infrastructure.repository.impl;

import com.tranan.productservice.domain.model.Review;
import com.tranan.productservice.domain.repository.ReviewRepository;
import com.tranan.productservice.infrastructure.entity.ReviewEntity;
import com.tranan.productservice.infrastructure.mapper.ReviewMapper;
import com.tranan.productservice.infrastructure.repository.jpa.ProductJpaRepository;
import com.tranan.productservice.infrastructure.repository.jpa.ReviewJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Transactional
public class ReviewRepositoryImpl implements ReviewRepository {
    private final ReviewJpaRepository reviewJpaRepository;
    private final ProductJpaRepository productJpaRepository;
    private final ReviewMapper reviewMapper;

    @Override
    public Review save(Review review, Long productId) {
        // KHÔNG orElseThrow – Application đã check
        var productRef = productJpaRepository.getReferenceById(productId);

        var entity = reviewMapper.toEntity(review, productRef);

        var saved = reviewJpaRepository.save(entity);

        return reviewMapper.toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Review> findById(Long id) {
        return reviewJpaRepository.findById(id)
                .map(reviewMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Review> findByProductId(Long productId, Pageable pageable) {

        return reviewJpaRepository
                .findAll(byProductId(productId), pageable)
                .map(reviewMapper::toDomain);
    }

    private Specification<ReviewEntity> byProductId(Long productId) {
        return (root, query, cb) -> cb.equal(root.get("product").get("id"), productId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByProductId(Long productId) {
        return reviewJpaRepository.countByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public double calculateAverageRating(Long productId) {
        Double avg = reviewJpaRepository.calculateAverageRating(productId);
        return avg != null ? avg : 0.0;
    }

    @Override
    public void deleteById(Long id) {
        reviewJpaRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Review> searchReview(String keyword, Pageable pageable) {

        Specification<ReviewEntity> spec = (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(
                    cb.lower(root.get("comment")),
                    "%" + keyword.toLowerCase() + "%");
        };

        return reviewJpaRepository.findAll(spec, pageable)
                .map(reviewMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    // ❌ SAI: public Page<ReviewEntity> findByProductIdOrderByCreateAtDesc(...)
    // ✅ ĐÚNG: Sửa Entity thành Review
    public Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable) {

        // 1. JPA trả về Entity
        Page<ReviewEntity> entities = reviewJpaRepository.findByProduct_IdOrderByCreatedAtDesc(productId, pageable);

        // 2. Mapper chuyển thành Domain
        // Dòng này trả về Page<Review>, khớp với chữ "Review" ở dòng khai báo hàm bên
        // trên
        return entities.map(reviewMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return reviewJpaRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public double calculateGlobalAverageRating() {
        Double avg = reviewJpaRepository.calculateGlobalAverageRating();
        return avg != null ? avg : 0.0;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Review> findByUserEmail(String userEmail, Pageable pageable) {
        return reviewJpaRepository.findByUserEmailOrderByCreatedAtDesc(userEmail, pageable)
                .map(reviewMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<com.tranan.productservice.application.usecase.ReviewService.MyReviewResponse> findByUserEmailWithProduct(
            String userEmail, Pageable pageable) {
        return reviewJpaRepository.findByUserEmailOrderByCreatedAtDesc(userEmail, pageable)
                .map(entity -> {
                    var response = new com.tranan.productservice.application.usecase.ReviewService.MyReviewResponse();
                    response.setId(entity.getId());
                    response.setRating(entity.getRating());
                    response.setComment(entity.getComment());
                    response.setCreatedAt(entity.getCreatedAt());

                    // Get product info
                    if (entity.getProduct() != null) {
                        response.setProductId(entity.getProduct().getId());
                        response.setProductName(entity.getProduct().getName());
                        response.setProductThumbnail(entity.getProduct().getThumbnail());
                    }

                    return response;
                });
    }

}
