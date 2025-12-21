package com.tranan.productservice.infrastructure.repository.impl;

import com.tranan.productservice.domain.model.Category;
import com.tranan.productservice.domain.repository.CategoryRepository;
import com.tranan.productservice.infrastructure.entity.CategoryEntity;
import com.tranan.productservice.infrastructure.mapper.CategoryMapper;
import com.tranan.productservice.infrastructure.repository.jpa.CategoryJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Transactional
public class CategoryRepositoryImpl implements CategoryRepository {

    private final CategoryJpaRepository categoryJpaRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public Category save(Category category) {
        CategoryEntity entity = categoryMapper.toEntity(category);
        CategoryEntity savedEntity = categoryJpaRepository.save(entity);
        return categoryMapper.toDomain(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Category> findById(Long id) {
        return categoryJpaRepository.findById(id)
                .map(categoryMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return categoryJpaRepository.existsById(id);
    }

    @Override
    public void deleteById(Long id) {
        categoryJpaRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Category> searchCategory(String keyword, Pageable pageable) {
        Specification<CategoryEntity> spec = (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            return cb.or(
                    cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("description")), "%" + keyword.toLowerCase() + "%")
            );
        };

        return categoryJpaRepository.findAll(spec, pageable)
                .map(categoryMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> findAllById(Set<Long> categoryIds) {
        // ✅ CHỈ 1 QUERY với IN clause - Không có N+1
        return categoryJpaRepository.findAllById(categoryIds)
                .stream()
                .map(categoryMapper::toDomain)
                .collect(Collectors.toList());
    }
}