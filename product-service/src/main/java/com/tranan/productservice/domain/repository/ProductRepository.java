package com.tranan.productservice.domain.repository;

import com.tranan.productservice.domain.model.Product;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductRepository {

    Product save(Product product);

    Optional<Product> findById(Long id);

    List<Product> findAllById(Collection<Long> ids);

    boolean existsById(Long id);

    void deleteById(Long id);

    Page<Product> searchProducts(String keyword, Pageable pageable);

    // Advanced search with filters
    Page<Product> searchProductsAdvanced(
            String keyword,
            List<Long> categoryIds,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Pageable pageable);

    boolean existsByCategoryId(Long categoryId);

    void updateProductStatistics(Long productId, Double averageRating, Long reviewCount);

    // Tìm kiếm product IDs theo tên
    List<Long> findIdsByNameContaining(String keyword);

    // Dashboard Statistics
    long count();

    // Lấy top sản phẩm bán chạy (sắp xếp theo reviewCount)
    List<Product> findTopByReviewCount(int limit);
}
