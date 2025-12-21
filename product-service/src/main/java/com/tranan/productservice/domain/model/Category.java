package com.tranan.productservice.domain.model;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class Category {

    private Long id;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    // ======================================================
    // Business Creation
    // ======================================================
    public Category(String name, String description) {
        this.name = name;
        this.description = description;
    }

    // ======================================================
    // Rehydration (Mapper từ DB)
    // ======================================================
    public Category(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    // ======================================================
    // Rehydration with timestamps (Mapper từ DB)
    // ======================================================
    public Category(Long id, String name, String description, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ======================================================
    // Business Methods
    // ======================================================
    public void updateInfo(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
