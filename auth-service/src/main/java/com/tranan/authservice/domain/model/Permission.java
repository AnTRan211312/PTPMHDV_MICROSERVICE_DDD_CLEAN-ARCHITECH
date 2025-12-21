package com.tranan.authservice.domain.model;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@NoArgsConstructor
public class Permission {
    private Long id;
    private String name;
    private String apiPath;
    private String method;
    private String module;
    private Instant createdAt;
    private Instant updatedAt;

    // Constructor full (Dùng cho Mapper)
    public Permission(Long id, String name, String apiPath, String method, String module, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.apiPath = apiPath;
        this.method = method;
        this.module = module;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Factory method
    public static Permission create(String name, String apiPath, String method, String module) {
        return new Permission(null, name, apiPath, method, module, Instant.now(), Instant.now());
    }

    // --- BUSINESS METHODS ---

    public void update(String name, String apiPath, String method, String module) {
        this.name = name;
        this.apiPath = apiPath;
        this.method = method;
        this.module = module;
        this.updatedAt = Instant.now();
    }
}