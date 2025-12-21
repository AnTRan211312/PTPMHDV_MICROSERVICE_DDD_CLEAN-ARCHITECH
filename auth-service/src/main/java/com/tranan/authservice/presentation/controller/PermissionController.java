package com.tranan.authservice.presentation.controller;

import com.tranan.authservice.annotation.ApiMessage;

import com.tranan.authservice.application.dto.request.permission.PermissionRequest;
import com.tranan.authservice.application.dto.response.PageResponseDto;
import com.tranan.authservice.application.dto.response.permission.PermissionResponse;
import java.util.List;
import com.tranan.authservice.application.usecase.PermissionService;
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

@Tag(name = "Permission Management")
@RestController
@RequestMapping("/api/permissions") // Đồng bộ với Gateway
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    @ApiMessage("Tạo quyền hạn thành công")
    @PreAuthorize("hasAuthority('POST /api/permissions')")
    @Operation(summary = "Tạo quyền hạn", description = "Yêu cầu quyền: <b>POST /api/permissions</b>")
    public ResponseEntity<PermissionResponse> createPermission(
            @Valid @RequestBody PermissionRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(permissionService.createPermission(request));
    }

    @GetMapping
    @ApiMessage("Lấy danh sách quyền hạn")
    @PreAuthorize("hasAuthority('GET /api/permissions')")
    @Operation(summary = "Lấy danh sách quyền hạn", description = "Yêu cầu quyền: <b>GET /api/permissions</b>")
    public ResponseEntity<PageResponseDto<PermissionResponse>> getPermissions(
            @RequestParam(required = false) String keyword, // Search đơn giản
            Pageable pageable) {
        // Gọi UseCase xử lý search
        Page<PermissionResponse> page = permissionService.findAllPermissions(keyword, pageable);

        PageResponseDto<PermissionResponse> response = new PageResponseDto<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @ApiMessage("Lấy tất cả quyền hạn")
    @Operation(summary = "Lấy tất cả quyền hạn (không phân trang)", description = "Yêu cầu quyền: <b>GET /api/permissions</b>")
    public ResponseEntity<List<PermissionResponse>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @PutMapping("/{id}")
    @ApiMessage("Cập nhật quyền hạn thành công")
    @PreAuthorize("hasAuthority('PUT /api/permissions/{id}')")
    @Operation(summary = "Cập nhật quyền hạn", description = "Yêu cầu quyền: <b>PUT /api/permissions/{id}</b>")
    public ResponseEntity<PermissionResponse> updatePermission(
            @PathVariable Long id,
            @Valid @RequestBody PermissionRequest request) {
        return ResponseEntity.ok(permissionService.updatePermission(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa quyền hạn thành công")
    @PreAuthorize("hasAuthority('DELETE /api/permissions/{id}')")
    @Operation(summary = "Xóa quyền hạn", description = "Yêu cầu quyền: <b>DELETE /api/permissions/{id}</b>")
    public ResponseEntity<PermissionResponse> deletePermission(@PathVariable Long id) {
        return ResponseEntity.ok(permissionService.deletePermission(id));
    }
}