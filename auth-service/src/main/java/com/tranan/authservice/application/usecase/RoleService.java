package com.tranan.authservice.application.usecase;

import com.tranan.authservice.application.dto.request.role.RoleRequest;
import com.tranan.authservice.application.dto.response.role.RoleResponse;
import com.tranan.authservice.domain.model.Permission;
import com.tranan.authservice.domain.model.Role;
import com.tranan.authservice.domain.repository.PermissionRepository;
import com.tranan.authservice.domain.repository.RoleRepository;
import com.tranan.authservice.domain.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        // 1. Tạo Domain Model
        Role role = Role.create(request.getName(), request.getDescription(), request.isActive());

        // 2. Xử lý Permission (Nếu có)
        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            Set<Long> permIds = request.getPermissions().stream()
                    .map(RoleRequest.PermissionId::getId)
                    .collect(Collectors.toSet());

            // Infra tìm List Permission
            List<Permission> permissions = permissionRepository.findAllById(permIds);

            // Validate số lượng
            if (permissions.size() != permIds.size()) {
                throw new EntityNotFoundException("Một số quyền hạn không tồn tại");
            }

            // Gán vào Domain
            role.assignPermissions(new HashSet<>(permissions));
        }

        // 3. Lưu & Map
        return mapToResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        // 1. Tìm Role
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Chức vụ không tồn tại"));

        // 2. Thực hiện Business Logic (Update Info)
        // Domain tự check rule ADMIN/USER -> Nếu vi phạm sẽ ném Exception ngay tại đây
        role.updateInfo(request.getName(), request.getDescription(), request.isActive());

        // 3. Update Permissions (Logic thay thế set cũ bằng set mới)
        if (request.getPermissions() != null) {
            Set<Long> permIds = request.getPermissions().stream()
                    .map(RoleRequest.PermissionId::getId)
                    .collect(Collectors.toSet());

            List<Permission> newPermissions = permissionRepository.findAllById(permIds);
            role.assignPermissions(new HashSet<>(newPermissions));
        }

        // 4. Lưu & Map
        return mapToResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Chức vụ không tồn tại"));

        // 1. Check Rule: Có được xóa không?
        role.validateDelete(); // Nếu là ADMIN -> Ném AccessDeniedException

        // 2. Lưu lại DTO để trả về (như code cũ của bạn)
        RoleResponse response = mapToResponse(role);

        // 3. Gỡ role khỏi các user đang nắm giữ (Side effect)
        userRepository.detachUsersFromRole(id);

        // 4. Xóa
        roleRepository.deleteById(id);

        return response;
    }

    public Page<RoleResponse> findAllRoles(String keyword, Pageable pageable) {
        // Gọi Infra để search
        return roleRepository.searchRoles(keyword, pageable)
                .map(this::mapToResponse);
    }

    // --- MANUAL MAPPER (Domain -> DTO) ---
    private RoleResponse mapToResponse(Role role) {
        if (role == null) return null;

        List<RoleResponse.Permission> permDtos = new ArrayList<>();
        if (role.getPermissions() != null) {
            permDtos = role.getPermissions().stream()
                    .map(p -> new RoleResponse.Permission(
                            p.getId(), p.getName(), p.getApiPath(), p.getMethod(), p.getModule()
                    )).toList();
        }

        RoleResponse dto = new RoleResponse(
                role.getId(),
                role.isActive(),
                role.getRoleName(),
                (role.getCreatedAt() != null) ? role.getCreatedAt().toString() : null,
                (role.getUpdatedAt() != null) ? role.getUpdatedAt().toString() : null,
                role.getRoleDescription()
        );
        dto.setPermissions(permDtos);
        return dto;
    }

}

