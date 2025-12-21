package com.tranan.cartservice.infrastructure.repository.impl;

import com.tranan.cartservice.domain.model.Cart;
import com.tranan.cartservice.domain.repository.CartRepository;
import com.tranan.cartservice.infrastructure.entity.CartEntity;
import com.tranan.cartservice.infrastructure.mapper.CartMapper;
import com.tranan.cartservice.infrastructure.repository.jpa.CartJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CartRepositoryImpl implements CartRepository {

    private final CartJpaRepository jpaRepository;
    private final CartMapper cartMapper;

    @Override
    public Cart save(Cart cart) {
        CartEntity entity = toDomainToEntity(cart);
        CartEntity saved = jpaRepository.save(entity);
        return toEntityToDomain(saved);
    }

    @Override
    public Optional<Cart> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId)
                .map(this::toEntityToDomain);
    }

    @Override
    public Optional<Cart> findById(Long cartId) {
        return jpaRepository.findById(cartId)
                .map(this::toEntityToDomain);
    }

    @Override
    public void delete(Cart cart) {
        if (cart.getId() != null) {
            jpaRepository.deleteById(cart.getId());
        }
    }

    @Override
    public boolean existsByUserId(Long userId) {
        return jpaRepository.existsByUserId(userId);
    }

    // ========== MAPPING ==========
    private CartEntity toDomainToEntity(Cart cart) {
        return cartMapper.toJpaEntity(cart);
    }

    private Cart toEntityToDomain(CartEntity entity) {
        return cartMapper.toDomain(entity);
    }
}