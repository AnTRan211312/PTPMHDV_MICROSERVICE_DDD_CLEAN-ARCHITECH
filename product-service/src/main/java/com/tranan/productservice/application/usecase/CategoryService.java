package com.tranan.productservice.application.usecase;

import com.tranan.productservice.application.dto.request.CreateCategoryRequest;
import com.tranan.productservice.application.dto.request.UpdateCategoryRequest;
import com.tranan.productservice.application.dto.response.CategoryResponse;
import com.tranan.productservice.domain.model.Category;
import com.tranan.productservice.domain.repository.CategoryRepository;
import com.tranan.productservice.domain.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    // =========================================================================
    // CREATE
    // =========================================================================

    @Transactional
    public CategoryResponse createCategory(@NotNull CreateCategoryRequest request) {
        log.info("Creating category: {}", request.getName());

        // Create category domain
        Category category = new Category(
                request.getName(),
                request.getDescription());

        // Save
        Category savedCategory = categoryRepository.save(category);
        log.info("Category created with ID: {}", savedCategory.getId());

        return mapToResponse(savedCategory);
    }

    // =========================================================================
    // READ - LIST
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAllCategories(String keyword, Pageable pageable) {
        log.debug("Getting categories with keyword: {}", keyword);

        // ✅ Repository trả về Page<Category>, cần map sang Page<CategoryResponse>
        Page<Category> categoryPage = categoryRepository.searchCategory(keyword, pageable);

        // ✅ Map Page<Category> → Page<CategoryResponse>
        return categoryPage.map(this::mapToResponse);
    }

    // =========================================================================
    // READ - DETAIL
    // =========================================================================

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(@NotNull @Min(1) Long id) {
        log.debug("Getting category by ID: {}", id);

        Category category = findCategoryById(id);
        return mapToResponse(category);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    @Transactional
    public CategoryResponse updateCategory(
            @NotNull @Min(1) Long id,
            @NotNull UpdateCategoryRequest request) {

        log.info("Updating category with ID: {}", id);

        Category category = findCategoryById(id);

        // Update domain
        category.updateInfo(request.getName(), request.getDescription());

        // Save
        Category updatedCategory = categoryRepository.save(category);
        log.info("Category updated with ID: {}", updatedCategory.getId());

        return mapToResponse(updatedCategory);
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    @Transactional
    public void deleteCategory(@NotNull @Min(1) Long id) {
        log.info("Deleting category with ID: {}", id);

        // 1. Kiểm tra Category có tồn tại không
        Category category = findCategoryById(id);

        // 2. Kiểm tra ràng buộc dữ liệu (Data Integrity)
        // "Nếu có bất kỳ sản phẩm nào thuộc danh mục này -> Chặn xóa"
        if (productRepository.existsByCategoryId(id)) {
            throw new DataIntegrityViolationException(
                    "Không thể xóa danh mục " + category.getName() + " vì đang có sản phẩm sử dụng nó.");
        }

        // 3. Xóa
        categoryRepository.deleteById(id);
        log.info("Category deleted with ID: {}", id);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Category not found with ID: " + id));
    }

    /**
     * Map Category domain → CategoryResponse DTO
     */
    private CategoryResponse mapToResponse(Category category) {
        if (category == null)
            return null;

        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());

        return response;
    }
}