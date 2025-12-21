package com.tranan.productservice.infrastructure.repository.jpa;

import com.tranan.productservice.infrastructure.entity.ReviewEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewJpaRepository extends JpaRepository<ReviewEntity, Long>, JpaSpecificationExecutor<ReviewEntity> {

    @Query("SELECT AVG(r.rating) FROM ReviewEntity r WHERE r.product.id = :productId")
    Double calculateAverageRating(@Param("productId") Long productId);

    Long countByProductId(Long productId);

    Page<ReviewEntity> findByProduct_IdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    // Find reviews by user email with product info
    @Query("SELECT r FROM ReviewEntity r JOIN FETCH r.product WHERE r.userEmail = :userEmail ORDER BY r.createdAt DESC")
    Page<ReviewEntity> findByUserEmailWithProduct(@Param("userEmail") String userEmail, Pageable pageable);

    Page<ReviewEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail, Pageable pageable);

    // Global statistics
    @Query("SELECT AVG(r.rating) FROM ReviewEntity r")
    Double calculateGlobalAverageRating();

}
