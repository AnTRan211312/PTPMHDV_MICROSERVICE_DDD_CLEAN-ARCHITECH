package com.tranan.authservice.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Getter
@NoArgsConstructor
public class Role {
    private Long id;
    private String roleName;
    private String roleDescription;
    private boolean active;
    private Set<Permission> permissions = new HashSet<>();
    private Instant createdAt;
    private Instant updatedAt;

    // --- SỬA Ở ĐÂY: Chỉ giữ lại ADMIN và USER ---
    private static final Set<String> SYSTEM_ROLES = Set.of("ADMIN", "USER");
    // --------------------------------------------

    // Constructor full (Dùng cho Mapper)
    public Role(Long id, String roleName, String roleDescription, boolean active,
                Set<Permission> permissions, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.roleName = roleName;
        this.roleDescription = roleDescription;
        this.active = active;
        this.permissions = (permissions != null) ? permissions : new HashSet<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Factory: Tạo Role mới (Custom role do admin tạo thêm)
    public static Role create(String name, String description, boolean active) {
        return new Role(null, name, description, active, new HashSet<>(), Instant.now(), Instant.now());
    }

    // --- LOGIC NGHIỆP VỤ (Giữ nguyên) ---

    // 1. Cập nhật thông tin
    public void updateInfo(String newName, String newDescription, boolean newActive) {
        // Nếu đang là ADMIN hoặc USER -> Không cho phép đổi tên
        if (isSystemRole() && !this.roleName.equalsIgnoreCase(newName)) {
            throw new AccessDeniedException("Không thể đổi tên quyền mặc định hệ thống (ADMIN, USER)");
        }
        this.roleName = newName;
        this.roleDescription = newDescription;
        this.active = newActive;
        this.updatedAt = Instant.now();
    }

    // 2. Gán quyền hạn
    public void assignPermissions(Set<Permission> newPermissions) {
        this.permissions = newPermissions;
        this.updatedAt = Instant.now();
    }

    // 3. Validate xóa
    public void validateDelete() {
        if (isSystemRole()) {
            throw new AccessDeniedException("Không thể xóa quyền mặc định hệ thống");
        }
    }

    // Helper check
    private boolean isSystemRole() {
        return this.roleName != null && SYSTEM_ROLES.contains(this.roleName.toUpperCase());
    }
}