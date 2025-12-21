package com.tranan.productservice.presentation.controller;

import com.tranan.productservice.annotation.ApiMessage;
import com.tranan.productservice.application.dto.request.CreateCategoryRequest;
import com.tranan.productservice.application.dto.request.UpdateCategoryRequest;
import com.tranan.productservice.application.dto.response.CategoryResponse;
import com.tranan.productservice.application.dto.response.PageResponseDto;
import com.tranan.productservice.application.usecase.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Category", description = "Quản lý danh mục sản phẩm")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Validated
public class CategoryController {

    private final CategoryService categoryService;

    // =========================================================================
    // CREATE
    // =========================================================================

    @PostMapping
    @ApiMessage("Tạo danh mục thành công")
    @PreAuthorize("hasAuthority('POST /api/categories')")
    @Operation(
            summary = "Tạo danh mục mới (Admin)",
            description = "Yêu cầu quyền: <b>POST /api/categories</b>"
    )
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoryService.createCategory(request));
    }

    // =========================================================================
    // READ - LIST
    // =========================================================================

    @GetMapping
    @ApiMessage("Lấy danh sách danh mục")
    @Operation(
            summary = "Lấy danh sách danh mục (Public)",
            description = "Hỗ trợ tìm kiếm theo keyword và phân trang. Không yêu cầu authentication."
    )
    public ResponseEntity<PageResponseDto<CategoryResponse>> getAllCategories( @Valid
            @RequestParam(required = false) String keyword,
            Pageable pageable) {

        Page<CategoryResponse> page = categoryService.getAllCategories(keyword, pageable);

        PageResponseDto<CategoryResponse> response = new PageResponseDto<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // READ - DETAIL
    // =========================================================================

    @GetMapping("/{id}")
    @ApiMessage("Lấy chi tiết danh mục")
    @PreAuthorize("hasAuthority('GET /api/categories/{id}')")
    @Operation(
            summary = "Lấy chi tiết danh mục theo ID (Public)",
            description = "Trả về thông tin chi tiết của danh mục. Không yêu cầu authentication."
    )
    @SecurityRequirement(name = "")
    public ResponseEntity<CategoryResponse> getCategoryById(
            @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id) {

        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    @PutMapping("/{id}")
    @ApiMessage("Cập nhật danh mục thành công")
    @PreAuthorize("hasAuthority('PUT /api/categories/{id}')")
    @Operation(
            summary = "Cập nhật danh mục (Admin)",
            description = "Yêu cầu quyền: <b>PUT /api/categories/{id}</b>"
    )
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa danh mục thành công")
    @PreAuthorize("hasAuthority('DELETE /api/categories/{id}')")
    @Operation(
            summary = "Xóa danh mục (Admin)",
            description = "Yêu cầu quyền: <b>DELETE /api/categories/{id}</b>. " +
                    "Lưu ý: Không thể xóa nếu danh mục đang được sử dụng bởi sản phẩm."
    )
    public ResponseEntity<Void> deleteCategory(
            @PathVariable @Min(value = 1, message = "ID phải lớn hơn 0") Long id) {

        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
