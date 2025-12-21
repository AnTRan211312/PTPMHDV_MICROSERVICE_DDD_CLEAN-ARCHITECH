package com.tranan.authservice.domain.repository;

import com.tranan.authservice.domain.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface RoleRepository {

    Role save(Role role);

    Optional<Role> findById(Long id);

    void deleteById(Long id);

    Optional<Role> findByRoleName(String name);

    // Search + Pagination dùng Pageable
    Page<Role> searchRoles(String keyword, Pageable pageable);

    void removePermissionFromAllRoles(Long permissionId);
}
