package com.tranan.authservice.infrastructure.repository.Impl;

import com.tranan.authservice.domain.model.Permission;
import com.tranan.authservice.domain.repository.PermissionRepository;
import com.tranan.authservice.infrastructure.repository.Jpa.JpaPermissionRepository;
import com.tranan.authservice.infrastructure.entity.PermissionEntity;
import com.tranan.authservice.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class PermissionRepositoryImpl implements PermissionRepository {

    private final JpaPermissionRepository jpaPermissionRepository;
    private final UserMapper userMapper; // Inject Mapper

    @Override
    public Optional<Permission> findById(Long id) {
        // 1. Gọi JPA lấy Entity
        Optional<PermissionEntity> entityOpt = jpaPermissionRepository.findById(id);

        // 2. Map sang Domain (dùng method reference cho gọn)
        return entityOpt.map(userMapper::toPermissionDomain);
    }

    @Override
    public Permission save(Permission permission) {
        PermissionEntity entity;
        if (permission.getId() != null) {
            PermissionEntity existingEntity = jpaPermissionRepository.findById(permission.getId())
                    .orElseThrow(() -> new RuntimeException("Permission not found with id: " + permission.getId()));

            existingEntity.setName(permission.getName());
            existingEntity.setApiPath(permission.getApiPath());
            existingEntity.setMethod(permission.getMethod());
            existingEntity.setModule(permission.getModule());

            entity = existingEntity;
        } else {
            entity = userMapper.toPermissionEntity(permission);
        }

        PermissionEntity savedEntity = jpaPermissionRepository.save(entity);
        return userMapper.toPermissionDomain(savedEntity);
    }

    @Override
    public void deleteById(Long id) {
        // Kiểm tra tồn tại cho an toàn
        if (jpaPermissionRepository.existsById(id)) {
            jpaPermissionRepository.deleteById(id);
        }
    }

    @Override
    public Page<Permission> searchPermissions(String keyword, Pageable pageable) {
        Specification<PermissionEntity> spec = (root, query, cb) -> {
            if (keyword == null || keyword.isEmpty())
                return cb.conjunction();

            // Tìm theo Name hoặc API Path hoặc Module
            String likePattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), likePattern),
                    cb.like(cb.lower(root.get("apiPath")), likePattern),
                    cb.like(cb.lower(root.get("module")), likePattern));
        };

        return jpaPermissionRepository.findAll(spec, pageable)
                .map(userMapper::toPermissionDomain);
    }

    @Override
    public List<Permission> findAllById(Set<Long> ids) {
        // 1. Gọi JPA để lấy List<PermissionEntity>
        List<PermissionEntity> entities = jpaPermissionRepository.findAllById(ids);

        // 2. Map sang List<Permission> (Domain)
        return entities.stream()
                .map(userMapper::toPermissionDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Permission> findAll() {
        return jpaPermissionRepository.findAll().stream()
                .map(userMapper::toPermissionDomain)
                .collect(Collectors.toList());
    }
}