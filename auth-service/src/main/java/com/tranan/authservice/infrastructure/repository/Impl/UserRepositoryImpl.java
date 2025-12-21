package com.tranan.authservice.infrastructure.repository.Impl;

import com.tranan.authservice.domain.model.User;

import com.tranan.authservice.domain.repository.UserRepository;

import com.tranan.authservice.infrastructure.repository.Jpa.JpaUserRepository;
import com.tranan.authservice.infrastructure.entity.UserEntity;
import com.tranan.authservice.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final JpaUserRepository jpaUserRepository;
    private final UserMapper userMapper;

    @Override
    public User save(User user) {
        UserEntity entity = userMapper.toEntity(user);
        // 2. Lưu xuống DB (JPA trả về entity đã lưu, có ID mới nếu là create)
        UserEntity savedEntity = jpaUserRepository.save(entity);
        // 3. Convert Entity -> Domain để trả về cho Service
        return userMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<User> findById(Long id) {
        Optional<UserEntity> optionalUserEntity = jpaUserRepository.findById(id);
        return optionalUserEntity.map(userMapper::toDomain);
    }

    @Override
    public void deleteById(Long id) {
        if (jpaUserRepository.existsById(id)) {
            jpaUserRepository.deleteById(id);
        }

    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaUserRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return false;
        }
        // Gọi hàm vừa khai báo ở Bước 1
        return jpaUserRepository.existsByPhoneNumber(phoneNumber);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        // 1. GỌI JPA (Lúc này IDE sẽ hết báo unused)
        Optional<UserEntity> entityOpt = jpaUserRepository.findByEmail(email);

        // 2. Map Entity -> Domain
        return entityOpt.map(userMapper::toDomain);
    }


    @Override
    @Transactional(readOnly = true)
    public List<User> findByEmailIn(List<String> emails) {
        // 1. Kiểm tra đầu vào để tránh lỗi hoặc query vô nghĩa
        if (emails == null || emails.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Gọi JPA để lấy danh sách Entity (SELECT ... WHERE email IN (...))
        List<UserEntity> entities = jpaUserRepository.findByEmailIn(emails);

        // 3. Map List<Entity> -> List<Domain>
        // Sử dụng Stream API để code gọn gàng
        return entities.stream()
                .map(userMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void detachUsersFromRole(Long roleId) {
        // Gọi câu lệnh Update SQL tùy chỉnh
        jpaUserRepository.detachRoleFromUsers(roleId);
    }

    @Override
    public Page<User> searchUsers(String keyword, Pageable pageable) {
        // 1. Tạo Specification
        Specification<UserEntity> spec = (root, cq, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction(); // Trả về tất cả
            }

            String likePattern = "%" + keyword.toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("username")), likePattern),
                    cb.like(cb.lower(root.get("email")), likePattern),
                    cb.like(cb.lower(root.get("phoneNumber")), likePattern));
        };

        // 2. Gọi JPA
        Page<UserEntity> entityPage = jpaUserRepository.findAll(spec, pageable);

        // 3. Map Entity -> Domain
        return entityPage.map(userMapper::toDomain);
    }

    @Override
    public long count() {
        return jpaUserRepository.count();
    }

}