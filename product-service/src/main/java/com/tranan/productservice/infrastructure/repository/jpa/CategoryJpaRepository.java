package com.tranan.productservice.infrastructure.repository.jpa;

import com.tranan.productservice.infrastructure.entity.CategoryEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;




public interface CategoryJpaRepository extends JpaRepository<CategoryEntity, Long>, JpaSpecificationExecutor<CategoryEntity> {


}
