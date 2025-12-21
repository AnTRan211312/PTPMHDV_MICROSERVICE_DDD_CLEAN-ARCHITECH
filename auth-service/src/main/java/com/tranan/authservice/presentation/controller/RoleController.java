package com.tranan.authservice.presentation.controller;

import com.tranan.authservice.annotation.ApiMessage;
import com.tranan.authservice.application.dto.request.role.RoleRequest; // DTO mới
import com.tranan.authservice.application.dto.response.PageResponseDto; // Giả sử bạn giữ class này

import com.tranan.authservice.application.dto.response.role.RoleResponse;
import com.tranan.authservice.application.usecase.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Role Management")
@RestController
@RequestMapping("/api/roles") // Đồng bộ với Gateway (/api/...)
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @ApiMessage("Tạo Role thành công")
    @PreAuthorize("hasAuthority('POST /api/roles')") // Lưu ý: Authority phải khớp với DB
    @Operation(summary = "Tạo mới Role")
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody RoleRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(roleService.createRole(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Cập nhật Role thành công")
    @PreAuthorize("hasAuthority('PUT /api/roles/{id}')")
    @Operation(summary = "Cập nhật Role")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request
    ) {
        return ResponseEntity.ok(roleService.updateRole(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa Role thành công")
    @PreAuthorize("hasAuthority('DELETE /api/roles/{id}')")
    @Operation(summary = "Xóa Role")
    public ResponseEntity<RoleResponse> deleteRole(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.deleteRole(id));
    }


    @GetMapping
    @ApiMessage("Lấy danh sách Role")
    @PreAuthorize("hasAuthority('GET /api/roles')")
    @Operation(summary = "Tìm kiếm và phân trang Role")
    public ResponseEntity<PageResponseDto<RoleResponse>> getRoles(
            @RequestParam(required = false) String keyword, // Search đơn giản
            Pageable pageable
    ) {
        // Gọi UseCase để tìm kiếm
        Page<RoleResponse> page = roleService.findAllRoles(keyword, pageable);

        // Map sang PageResponseDto (Class tiện ích của bạn)
        PageResponseDto<RoleResponse> response = new PageResponseDto<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }
}