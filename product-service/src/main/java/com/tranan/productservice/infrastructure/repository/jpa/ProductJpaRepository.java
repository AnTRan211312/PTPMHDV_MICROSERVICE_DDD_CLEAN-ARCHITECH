package com.tranan.productservice.infrastructure.repository.jpa;

import com.tranan.productservice.infrastructure.entity.ProductEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductJpaRepository
        extends JpaRepository<ProductEntity, Long>, JpaSpecificationExecutor<ProductEntity> {

    boolean existsByCategories_Id(Long categoryId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ProductEntity p SET p.averageRating = :avg, p.reviewCount = :count, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :id")
    void updateProductStatistics(@Param("id") Long id, @Param("avg") Double avg, @Param("count") Long count);

    @Query("SELECT p.id FROM ProductEntity p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    java.util.List<Long> findIdsByNameContaining(@Param("keyword") String keyword);

}