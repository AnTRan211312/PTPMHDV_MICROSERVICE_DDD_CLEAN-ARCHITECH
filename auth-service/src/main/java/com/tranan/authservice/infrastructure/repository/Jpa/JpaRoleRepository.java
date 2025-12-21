package com.tranan.authservice.infrastructure.repository.Jpa;

import com.tranan.authservice.infrastructure.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface JpaRoleRepository extends JpaRepository<RoleEntity, Long>, JpaSpecificationExecutor<RoleEntity> {
    Optional<RoleEntity> findByRoleName(String roleName);

    List<RoleEntity> findAllByPermissions_Id(Long permissionsId);
}