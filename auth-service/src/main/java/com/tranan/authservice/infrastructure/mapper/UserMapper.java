package com.tranan.authservice.infrastructure.mapper;

import com.tranan.authservice.domain.model.*;
import com.tranan.authservice.infrastructure.entity.*;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component // <--- QUAN TRỌNG: Để Spring quản lý bean này
public class UserMapper {

    // ========================================================================
    // PHẦN 1: ENTITY -> DOMAIN (Lấy từ DB lên)
    // ========================================================================

    public User toDomain(UserEntity entity) {
        if (entity == null) {
            return null;
        }

        // 1. Convert Password
        Password passwordDomain = null;
        if (entity.getPassword() != null) {
            passwordDomain = new Password(entity.getPassword());
        }

        // 2. Convert Gender
        DomainGender domainGender = null;
        if (entity.getGender() != null) {
            try {
                domainGender = DomainGender.valueOf(entity.getGender().name());
            } catch (IllegalArgumentException e) {
                domainGender = DomainGender.OTHER;
            }
        }

        // 3. Convert Role
        Role roleDomain = toRoleDomain(entity.getRole());



        // 5. Build User Domain
        return User.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .email(entity.getEmail())
                .password(passwordDomain)
                .phoneNumber(entity.getPhoneNumber())
                .birthDate(entity.getBirthDate())
                .address(entity.getAddress())
                .gender(domainGender)
                .logoUrl(entity.getLogoUrl())
                .role(roleDomain)
                .createdAt(entity.getCreateDate()) // Lấy từ JPA Auditing
                .updatedAt(entity.getUpdateDate())
                .build();
    }

    // Helper: Role Entity -> Role Domain
    public Role toRoleDomain(RoleEntity entity) {
        if (entity == null) {
            return null;
        }

        Set<Permission> permissions = new HashSet<>();
        if (entity.getPermissions() != null) {
            permissions = entity.getPermissions().stream()
                    .map(this::toPermissionDomain)
                    .collect(Collectors.toSet());
        }

        return new Role(
                entity.getId(),
                entity.getRoleName(),
                entity.getRoleDescription(),
                entity.isActive(),
                permissions,
                entity.getCreateDate(), // <--- THÊM MỚI: Lấy ngày tạo từ Entity
                entity.getUpdateDate());
    }

    // Helper: Permission Entity -> Permission Domain
    public Permission toPermissionDomain(PermissionEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Permission(
                entity.getId(),
                entity.getName(),
                entity.getApiPath(),
                entity.getMethod(),
                entity.getModule(),
                entity.getCreateDate(),
                entity.getUpdateDate());
    }

    // ========================================================================
    // PHẦN 2: DOMAIN -> ENTITY (Lưu xuống DB)
    // ========================================================================

    public UserEntity toEntity(User domain) {
        if (domain == null) {
            return null;
        }

        // 1. Extract Password Value
        String passwordValue = (domain.getPassword() != null) ? domain.getPassword().getValue() : null;

        // 2. Convert Gender
        EntityGender entityGender = null;
        if (domain.getGender() != null) {
            entityGender = EntityGender.valueOf(domain.getGender().name());
        }

        // 3. Convert Role
        RoleEntity roleEntity = toRoleEntity(domain.getRole());



        return new UserEntity(
                domain.getId(),
                domain.getUsername(),
                domain.getEmail(),
                passwordValue,
                domain.getPhoneNumber(),
                domain.getBirthDate(),
                domain.getAddress(),
                entityGender,
                domain.getLogoUrl(),
                roleEntity);
    }

    // Helper: Role Domain -> Role Entity
    public RoleEntity toRoleEntity(Role domain) {
        if (domain == null)
            return null;

        RoleEntity entity = new RoleEntity();
        entity.setId(domain.getId());
        entity.setRoleName(domain.getRoleName());
        entity.setRoleDescription(domain.getRoleDescription());
        entity.setActive(domain.isActive());

        // Map permissions
        if (domain.getPermissions() != null && !domain.getPermissions().isEmpty()) {
            Set<PermissionEntity> permissionEntities = domain.getPermissions().stream()
                    .map(this::toPermissionEntity)
                    .collect(Collectors.toSet());
            entity.setPermissions(permissionEntities);
        }

        return entity;
    }

    // Helper: Permission Domain -> Permission Entity
    public PermissionEntity toPermissionEntity(Permission domain) {
        if (domain == null)
            return null;
        PermissionEntity entity = new PermissionEntity();
        entity.setId(domain.getId());
        entity.setName(domain.getName());
        entity.setApiPath(domain.getApiPath());
        entity.setMethod(domain.getMethod());
        entity.setModule(domain.getModule());
        return entity;
    }

}