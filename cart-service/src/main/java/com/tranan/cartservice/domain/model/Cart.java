package com.tranan.cartservice.domain.model;

import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
public class Cart {
    private Long id;
    private Long userId;
    private List<CartItem> items;
    private Instant createdAt;
    private Instant updatedAt;

    // Constructor cho cart mới
    public Cart(Long userId) {
        this.userId = userId;
        this.items = new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // Constructor từ DB
    public Cart(Long id, Long userId, List<CartItem> items,
                Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.items = items != null ? items : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ========== BUSINESS LOGIC ==========

    public void addItem(Long productId, String productName, String productDescription, String productImage,
                        BigDecimal price, BigDecimal discountPrice, int quantity) {
        CartItem existingItem = findItemByProductId(productId);

        if (existingItem != null) {
            existingItem.increaseQuantity(quantity);
        } else {
            CartItem newItem = CartItem.builder()
                    .productId(productId)
                    .productName(productName)
                    .productDescription(productDescription)
                    .productImage(productImage)
                    .price(price)
                    .discountPrice(discountPrice)
                    .quantity(quantity)
                    .createAt(Instant.now())
                    .build();
            this.items.add(newItem);
        }
        this.updatedAt = Instant.now();
    }

    public void updateItemQuantity(Long productId, int newQuantity) {
        CartItem item = findItemByProductId(productId);
        if (item == null) {
            throw new IllegalArgumentException("Product not found in cart");
        }
        item.updateQuantity(newQuantity);
        this.updatedAt = Instant.now();
    }

    public void removeItem(Long productId) {
        boolean removed = items.removeIf(item -> item.isSameProduct(productId));
        if (!removed) {
            throw new IllegalArgumentException("Product not found in cart");
        }
        this.updatedAt = Instant.now();
    }

    public void clear() {
        this.items.clear();
        this.updatedAt = Instant.now();
    }

    // Tính tổng tiền: tự động dùng discountPrice nếu có
    public BigDecimal getTotalAmount() {
        return items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public int getTotalItemCount() {
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }

    private CartItem findItemByProductId(Long productId) {
        return items.stream()
                .filter(item -> item.isSameProduct(productId))
                .findFirst()
                .orElse(null);
    }
}