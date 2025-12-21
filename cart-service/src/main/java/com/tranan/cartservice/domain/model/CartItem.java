package com.tranan.cartservice.domain.model;

import lombok.*;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;


// ==================== CART ITEM ====================

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    private Long id;
    private Long productId;
    private String productName;
    private String productDescription;
    private String productImage;
    private BigDecimal price;           // Giá gốc
    private BigDecimal discountPrice;   // Giá giảm (nullable)
    private int quantity;
    private Instant createAt;

    public CartItem(Long productId, String productName, BigDecimal price,
                    BigDecimal discountPrice, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
        this.productId = productId;
        this.productName = productName;
        this.price = price;
        this.discountPrice = discountPrice;
        this.quantity = quantity;
        this.createAt = Instant.now();
    }

    public CartItem(Long id, Long productId, String productName, BigDecimal originalPrice, BigDecimal discountPrice, Integer quantity, Instant createdAt) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.price = originalPrice;
        this.discountPrice = discountPrice;
        this.quantity = quantity;
        this.createAt = createdAt;
    }

    public void increaseQuantity(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        this.quantity += amount;
    }

    public void updateQuantity(int newQuantity) {
        if (newQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.quantity = newQuantity;
    }

    // Lấy giá hiệu dụng: ưu tiên discountPrice nếu có
    public BigDecimal getEffectivePrice() {
        return discountPrice != null ? discountPrice : price;
    }

    public BigDecimal getSubtotal() {
        return getEffectivePrice().multiply(BigDecimal.valueOf(quantity));
    }

    public boolean isSameProduct(Long productId) {
        return this.productId.equals(productId);
    }
}
