package com.tranan.authservice.application.usecase;

import com.tranan.authservice.application.dto.request.permission.PermissionRequest;
import com.tranan.authservice.application.dto.response.permission.PermissionResponse;
import com.tranan.authservice.domain.model.Permission;
import com.tranan.authservice.domain.repository.PermissionRepository;
import com.tranan.authservice.domain.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        // 1. Tạo Domain
        Permission permission = Permission.create(
                request.getName(),
                request.getApiPath(),
                request.getMethod(),
                request.getModule());

        // 2. Lưu & Map
        return mapToResponse(permissionRepository.save(permission));
    }

    @Transactional
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        // 1. Tìm Permission
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền hạn này"));

        // 2. Update logic (Domain Model tự set updatedAt)
        permission.update(
                request.getName(),
                request.getApiPath(),
                request.getMethod(),
                request.getModule());

        // 3. Lưu & Map
        return mapToResponse(permissionRepository.save(permission));
    }

    @Transactional
    public PermissionResponse deletePermission(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền hạn này"));

        // 1. Lưu DTO để trả về
        PermissionResponse response = mapToResponse(permission);

        // 2. Gỡ Permission khỏi tất cả các Role đang chứa nó (Side effect)
        // Việc này quan trọng để tránh lỗi khóa ngoại hoặc dữ liệu rác
        roleRepository.removePermissionFromAllRoles(id);

        // 3. Xóa Permission
        permissionRepository.deleteById(id);

        return response;
    }

    public Page<PermissionResponse> findAllPermissions(String keyword, Pageable pageable) {
        // Delegate việc search cho Infra
        return permissionRepository.searchPermissions(keyword, pageable)
                .map(this::mapToResponse);
    }

    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- MANUAL MAPPER ---
    private PermissionResponse mapToResponse(Permission permission) {
        if (permission == null)
            return null;
        return new PermissionResponse(
                permission.getId(),
                permission.getName(),
                permission.getApiPath(),
                permission.getMethod(),
                permission.getModule(),
                (permission.getCreatedAt() != null) ? permission.getCreatedAt().toString() : null,
                (permission.getUpdatedAt() != null) ? permission.getUpdatedAt().toString() : null);
    }
}
