package com.tranan.authservice.infrastructure.repository.Jpa;

import com.tranan.authservice.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JpaUserRepository extends JpaRepository<UserEntity, Long>, JpaSpecificationExecutor<UserEntity> {
    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    Optional<UserEntity> findByEmail(String email);

    @Modifying // Báo hiệu đây là câu lệnh UPDATE/DELETE
    @Query("UPDATE UserEntity u SET u.role = null WHERE u.role.id = :roleId")
    void detachRoleFromUsers(Long roleId);

    List<UserEntity> findByEmailIn(Collection<String> emails);

}
