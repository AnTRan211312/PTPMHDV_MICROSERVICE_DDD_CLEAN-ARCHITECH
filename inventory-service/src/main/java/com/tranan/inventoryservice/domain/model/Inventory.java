package com.tranan.inventoryservice.domain.model;

import com.netflix.spectator.api.Meter;
import com.tranan.inventoryservice.presentation.advice.exception.InsufficientStockException;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Domain Model - POJO (Plain Old Java Object)
 * Không có JPA annotations, chỉ có business logic
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@SuperBuilder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Inventory {

    @EqualsAndHashCode.Include
    private Long id;

    private Long productId;

    private Integer quantity;

    private Long version;

    private Instant createdAt;

    private Instant updatedAt;


    // ═════════════════════════════════════════════════════════════════════
    // BUSINESS METHODS
    // ═════════════════════════════════════════════════════════════════════

    public boolean hasStock(Integer requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new IllegalArgumentException("Requested quantity must be positive");
        }
        return quantity >= requestedQuantity;
    }

    public void addStock(Integer amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        this.quantity += amount;
    }

    public void reduceStock(Integer amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (!hasStock(amount)) {
            throw new InsufficientStockException(
                    String.format("Insufficient stock for product %d. Available: %d, Requested: %d",
                            productId, quantity, amount)
            );
        }
        this.quantity -= amount;
    }

    public void setQuantity(Integer newQuantity) {
        if (newQuantity == null || newQuantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        this.quantity = newQuantity;
    }
}