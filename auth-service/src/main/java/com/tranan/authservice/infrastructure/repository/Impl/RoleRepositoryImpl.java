package com.tranan.authservice.infrastructure.repository.Impl;

import com.tranan.authservice.domain.model.Role;
import com.tranan.authservice.domain.repository.RoleRepository;
import com.tranan.authservice.infrastructure.repository.Jpa.JpaRoleRepository;
import com.tranan.authservice.infrastructure.entity.RoleEntity;
import com.tranan.authservice.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class RoleRepositoryImpl implements RoleRepository {

    private final UserMapper userMapper;
    private final JpaRoleRepository jpaRoleRepository;

    @Override
    public Role save(Role role) {
        RoleEntity entity;
        if (role.getId() != null) {
            RoleEntity existingEntity = jpaRoleRepository.findById(role.getId())
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + role.getId()));

            existingEntity.setRoleName(role.getRoleName());
            existingEntity.setRoleDescription(role.getRoleDescription());
            existingEntity.setActive(role.isActive());
            // Update permissions if needed
            if (role.getPermissions() != null) {
                existingEntity.setPermissions(role.getPermissions().stream()
                        .map(userMapper::toPermissionEntity)
                        .collect(Collectors.toSet()));
            }

            entity = existingEntity;
        } else {
            entity = userMapper.toRoleEntity(role);
        }

        RoleEntity savedRoleEntity = jpaRoleRepository.save(entity);
        return userMapper.toRoleDomain(savedRoleEntity);
    }

    @Override
    public Optional<Role> findById(Long id) {
        return jpaRoleRepository.findById(id)
                .map(userMapper::toRoleDomain);
    }

    @Override
    public void deleteById(Long id) {
        // Kiểm tra tồn tại trước khi xóa để tránh lỗi không mong muốn
        if (jpaRoleRepository.existsById(id)) {
            jpaRoleRepository.deleteById(id);
        }

    }

    // Nếu trong Interface RoleRepository bạn có khai báo findByRoleName
    @Override
    public Optional<Role> findByRoleName(String roleName) {
        return jpaRoleRepository.findByRoleName(roleName)
                .map(userMapper::toRoleDomain);
    }

    @Override
    public Page<Role> searchRoles(String keyword, Pageable pageable) {
        Specification<RoleEntity> spec = (root, query, cb) -> {
            if (keyword == null || keyword.isEmpty())
                return cb.conjunction();
            return cb.like(cb.lower(root.get("roleName")), "%" + keyword.toLowerCase() + "%");
        };

        return jpaRoleRepository.findAll(spec, pageable)
                .map(userMapper::toRoleDomain); // <--- SỬA THÀNH toRoleDomain
    }

    @Override
    public void removePermissionFromAllRoles(Long permissionId) {
        List<RoleEntity> rolesWithPermission = jpaRoleRepository.findAllByPermissions_Id((permissionId));
        for (RoleEntity role : rolesWithPermission) {
            role.getPermissions().removeIf(p -> p.getId().equals(permissionId));
        }
        jpaRoleRepository.saveAll(rolesWithPermission);

    }
}
