package com.tranan.productservice.infrastructure.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description; // Mô tả chung của danh mục (Dùng cho SEO)

    // ✅ FIX: mappedBy phải trỏ đúng tên field trong ProductEntity
    @ManyToMany(mappedBy = "categories") // ← ĐÂY! Đổi từ "category" sang "categories"
    private Set<ProductEntity> products = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof CategoryEntity))
            return false;
        CategoryEntity that = (CategoryEntity) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
