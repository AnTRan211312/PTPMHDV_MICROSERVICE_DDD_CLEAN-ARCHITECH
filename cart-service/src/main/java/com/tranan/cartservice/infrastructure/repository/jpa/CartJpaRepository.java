package com.tranan.cartservice.infrastructure.repository.jpa;

import com.tranan.cartservice.infrastructure.entity.CartEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartJpaRepository extends JpaRepository<CartEntity, Long> {
    Optional<CartEntity> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
