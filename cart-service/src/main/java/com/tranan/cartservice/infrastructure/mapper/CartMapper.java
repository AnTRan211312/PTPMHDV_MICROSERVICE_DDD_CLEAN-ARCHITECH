package com.tranan.cartservice.infrastructure.mapper;

import com.tranan.cartservice.domain.model.Cart;
import com.tranan.cartservice.domain.model.CartItem;
import com.tranan.cartservice.infrastructure.entity.CartEntity;
import com.tranan.cartservice.infrastructure.entity.CartItemEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CartMapper {

    public CartEntity toJpaEntity(Cart cart) {
        if (cart == null) {
            return null;
        }

        CartEntity jpaEntity = new CartEntity();
        jpaEntity.setId(cart.getId());
        jpaEntity.setUserId(cart.getUserId());
        jpaEntity.setCreatedAt(cart.getCreatedAt());
        jpaEntity.setUpdatedAt(cart.getUpdatedAt());

        // Map items
        if (cart.getItems() != null) {
            List<CartItemEntity> jpaItems = cart.getItems().stream()
                    .map(item -> toJpaEntity(item, jpaEntity))
                    .collect(Collectors.toList());
            jpaEntity.setItems(jpaItems);
        }

        return jpaEntity;
    }

    private CartItemEntity toJpaEntity(CartItem item, CartEntity cart) {
        if (item == null) {
            return null;
        }

        CartItemEntity jpaItem = new CartItemEntity();
        jpaItem.setId(item.getId());
        jpaItem.setCart(cart);

        jpaItem.setProductId(item.getProductId());
        jpaItem.setProductName(item.getProductName());
        jpaItem.setOriginalPrice(item.getPrice());
        jpaItem.setDiscountPrice(item.getDiscountPrice());
        jpaItem.setQuantity(item.getQuantity());

        // Sửa: Dùng getCreatedAt() thay vì getCreateAt()
        jpaItem.setCreatedAt(item.getCreateAt());

        return jpaItem;
    }

    public Cart toDomain(CartEntity jpaEntity) {
        if (jpaEntity == null) {
            return null;
        }

        List<CartItem> items = null;
        if (jpaEntity.getItems() != null) {
            items = jpaEntity.getItems().stream()
                    .map(this::toDomain)
                    .collect(Collectors.toList());
        }

        return new Cart(
                jpaEntity.getId(),
                jpaEntity.getUserId(),
                items,
                jpaEntity.getCreatedAt(),
                jpaEntity.getUpdatedAt()
        );
    }

    private CartItem toDomain(CartItemEntity entity) {
        if (entity == null) {
            return null;
        }

        return new CartItem(
                entity.getId(),
                entity.getProductId(),
                entity.getProductName(),
                entity.getOriginalPrice(),
                entity.getDiscountPrice(),
                entity.getQuantity(),
                entity.getCreatedAt()
        );
    }
}