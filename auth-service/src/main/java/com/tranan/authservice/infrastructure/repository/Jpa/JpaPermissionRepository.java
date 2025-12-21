package com.tranan.authservice.infrastructure.repository.Jpa;

import com.tranan.authservice.infrastructure.entity.PermissionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;



public interface JpaPermissionRepository extends
        JpaRepository<PermissionEntity, Long>,
        JpaSpecificationExecutor<PermissionEntity> {
}