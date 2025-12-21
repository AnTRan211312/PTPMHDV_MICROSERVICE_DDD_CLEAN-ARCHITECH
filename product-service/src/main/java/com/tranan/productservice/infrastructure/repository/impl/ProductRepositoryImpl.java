package com.tranan.productservice.infrastructure.repository.impl;

import com.tranan.productservice.domain.model.Product;
import com.tranan.productservice.domain.repository.ProductRepository;
import com.tranan.productservice.infrastructure.entity.CategoryEntity;
import com.tranan.productservice.infrastructure.entity.ProductEntity;
import com.tranan.productservice.infrastructure.mapper.ProductMapper;
import com.tranan.productservice.infrastructure.repository.jpa.CategoryJpaRepository;
import com.tranan.productservice.infrastructure.repository.jpa.ProductJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ProductRepositoryImpl implements ProductRepository {

    private final ProductJpaRepository productJpaRepository;
    private final ProductMapper productMapper;
    private final CategoryJpaRepository categoryJpaRepository;

    @Override
    @Transactional
    public Product save(Product product) {

        ProductEntity productEntity = productMapper.toEntity(product);

        // Map categoryIds -> CategoryEntity
        Set<CategoryEntity> categories = new HashSet<>(categoryJpaRepository.findAllById(product.getCategoryIds()));
        productEntity.setCategories(categories);

        ProductEntity savedEntity = productJpaRepository.save(productEntity);

        return productMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Product> findById(Long id) {
        return productJpaRepository.findById(id)
                .map(productMapper::toDomain);
    }

    @Override
    public List<Product> findAllById(Collection<Long> ids) {
        return productJpaRepository.findAllById(ids)
                .stream()
                .map(productMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsById(Long id) {
        return productJpaRepository.existsById(id);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        productJpaRepository.deleteById(id);
    }

    @Override
    public Page<Product> searchProducts(String keyword, Pageable pageable) {
        Specification<ProductEntity> spec = (root, query, cb) -> {
            if (keyword == null || keyword.isEmpty())
                return cb.conjunction();
            return cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%");
        };
        return productJpaRepository.findAll(spec, pageable)
                .map(productMapper::toDomain);
    }

    @Override
    public Page<Product> searchProductsAdvanced(
            String keyword,
            List<Long> categoryIds,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Pageable pageable) {

        Specification<ProductEntity> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            // Keyword filter
            if (keyword != null && !keyword.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }

            // Category filter - Product must belong to at least one of the selected
            // categories
            if (categoryIds != null && !categoryIds.isEmpty()) {
                jakarta.persistence.criteria.Join<ProductEntity, CategoryEntity> categoryJoin = root.join("categories");
                predicates.add(categoryJoin.get("id").in(categoryIds));
                query.distinct(true); // Avoid duplicates when joining
            }

            // Price filter - use discountPrice if available, otherwise price
            if (minPrice != null && minPrice.compareTo(java.math.BigDecimal.ZERO) > 0) {
                predicates.add(cb.or(
                        cb.and(cb.isNotNull(root.get("discountPrice")), cb.ge(root.get("discountPrice"), minPrice)),
                        cb.and(cb.isNull(root.get("discountPrice")), cb.ge(root.get("price"), minPrice))));
            }

            if (maxPrice != null && maxPrice.compareTo(java.math.BigDecimal.ZERO) > 0) {
                predicates.add(cb.or(
                        cb.and(cb.isNotNull(root.get("discountPrice")), cb.le(root.get("discountPrice"), maxPrice)),
                        cb.and(cb.isNull(root.get("discountPrice")), cb.le(root.get("price"), maxPrice))));
            }

            return predicates.isEmpty() ? cb.conjunction()
                    : cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return productJpaRepository.findAll(spec, pageable)
                .map(productMapper::toDomain);
    }

    @Override
    public boolean existsByCategoryId(Long categoryId) {
        // Gọi hàm của JPA đã khai báo ở bước 1
        return productJpaRepository.existsByCategories_Id(categoryId);
    }

    @Override
    public void updateProductStatistics(Long productId, Double averageRating, Long reviewCount) {
        // LOGIC LINH HOẠT:
        // Service đã tính sẵn rồi, Repository chỉ việc update thôi.
        // Đừng tính lại ở đây nữa -> Tránh lỗi dữ liệu chưa đồng bộ.

        productJpaRepository.updateProductStatistics(productId, averageRating, reviewCount);
    }

    @Override
    public List<Long> findIdsByNameContaining(String keyword) {
        return productJpaRepository.findIdsByNameContaining(keyword);
    }

    @Override
    public long count() {
        return productJpaRepository.count();
    }

    @Override
    public List<Product> findTopByReviewCount(int limit) {
        return productJpaRepository.findAll(
                org.springframework.data.domain.PageRequest.of(0, limit,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,
                                "reviewCount")))
                .getContent().stream()
                .map(productMapper::toDomain)
                .collect(Collectors.toList());
    }
}
