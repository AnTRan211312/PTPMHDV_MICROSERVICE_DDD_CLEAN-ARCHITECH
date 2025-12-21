package com.tranan.productservice.domain.repository;

import com.tranan.productservice.domain.model.Category;
import com.tranan.productservice.domain.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(Long id);

    boolean existsById(Long id);

    void deleteById(Long id);

    Page<Category> searchCategory(String keyword, Pageable pageable);


    List<Category> findAllById(Set<Long> categoryIds);
}
