package com.tranan.cartservice.domain.repository;

import com.tranan.cartservice.domain.model.Cart;

import java.util.Optional;

public interface CartRepository {
    Cart save(Cart cart);
    Optional<Cart> findByUserId(Long userId);
    Optional<Cart> findById(Long cartId);
    void delete(Cart cart);
    boolean existsByUserId(Long userId);
}
