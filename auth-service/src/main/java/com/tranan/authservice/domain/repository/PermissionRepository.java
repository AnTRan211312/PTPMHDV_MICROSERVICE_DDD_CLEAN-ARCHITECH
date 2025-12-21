package com.tranan.authservice.domain.repository;

import com.tranan.authservice.domain.model.Permission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PermissionRepository {

    List<Permission> findAllById(Set<Long> ids);

    Permission save(Permission permission);

    Optional<Permission> findById(Long id);

    void deleteById(Long id);

    // Search + Pagination dùng Pageable
    Page<Permission> searchPermissions(String keyword, Pageable pageable);

    List<Permission> findAll();
}
