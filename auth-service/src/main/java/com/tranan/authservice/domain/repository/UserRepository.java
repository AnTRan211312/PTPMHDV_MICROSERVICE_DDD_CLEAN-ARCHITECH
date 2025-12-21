package com.tranan.authservice.domain.repository;

import com.tranan.authservice.domain.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    void deleteById(Long id);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    Optional<User> findByEmail(String email);

    List<User> findByEmailIn(List<String> emails);

    void detachUsersFromRole(Long roleId);

    // Search + Pagination dùng Pageable
    Page<User> searchUsers(String keyword, Pageable pageable);

    // Dashboard Statistics
    long count();
}
