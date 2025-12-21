package com.tranan.inventoryservice.infrastructure.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * JPA Entity - Persistence model
 * Chỉ dùng để map với database, KHÔNG có business logic
 */
@Entity
@Table(name = "inventories")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
public class InventoryEntity extends  BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    // Optimistic Locking
    @Version
    @Column(name = "version")
    private Long version;

}