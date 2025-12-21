package com.tranan.productservice.domain.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Product {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;

    @Setter
    private String thumbnail;

    // Audit fields
    private Instant createdAt;
    private Instant updatedAt;

    // Aggregate data
    private List<String> images;
    private List<Review> reviews;
    private Set<Long> categoryIds;

    // Derived data
    private Double averageRating;
    private int reviewCount;

    // =========================================================================
    // FACTORY METHOD - Business Creation
    // =========================================================================

    public static Product createProduct(String name, String description,
                                        BigDecimal price, String thumbnail) {
        return Product.builder()
                .id(null) // DB auto-generate
                .name(name)
                .description(description)
                .price(price)
                .thumbnail(thumbnail)
                .images(new ArrayList<>())
                .reviews(new ArrayList<>())
                .categoryIds(new HashSet<>())
                .averageRating(0.0)
                .reviewCount(0)
                .createdAt(null) // Infrastructure concern
                .updatedAt(null)
                .build();
    }

    // =========================================================================
    // CONSTRUCTOR - Reconstitution (Mapper từ DB)
    // =========================================================================

    public Product(Long id, String name, String description, BigDecimal price,
                   BigDecimal discountPrice, String thumbnail,
                   List<String> images, List<Review> reviews,
                   Double averageRating, int reviewCount,
                   Set<Long> categoryIds,
                   Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.discountPrice = discountPrice;
        this.thumbnail = thumbnail;
        this.images = images != null ? images : new ArrayList<>();
        this.reviews = reviews != null ? reviews : new ArrayList<>();
        this.categoryIds = categoryIds != null ? categoryIds : new HashSet<>();
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // =========================================================================
    // BUSINESS METHODS - Update Operations
    // =========================================================================

    /**
     * Update basic product information (null-safe)
     */
    public void updateBasicInfo(String name, String description, BigDecimal price) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (price != null) {
            changePrice(price);
        }
    }

    /**
     * Update thumbnail URL
     */
    public void updateThumbnail(String thumbnail) {
        if (thumbnail != null && !thumbnail.isBlank()) {
            this.thumbnail = thumbnail;
        }
    }

    /**
     * Replace images list
     */
    public void updateImages(List<String> images) {
        if (images != null) {
            setImages(images);
        }
    }

    /**
     * Update discount - pass null to remove discount
     */
    public void updateDiscount(BigDecimal discountPrice) {
        if (discountPrice == null) {
            cancelDiscount();
        } else {
            applyDiscount(discountPrice);
        }
    }

    /**
     * Replace all categories
     */
    public void updateCategories(Set<Long> newCategoryIds) {
        if (newCategoryIds == null || newCategoryIds.isEmpty()) {
            throw new IllegalArgumentException("Sản phẩm phải thuộc ít nhất 1 danh mục");
        }
        this.categoryIds.clear();
        this.categoryIds.addAll(newCategoryIds);
    }

    // =========================================================================
    // BUSINESS METHODS - Category Management
    // =========================================================================

    public void assignToCategory(Long categoryId) {
        validateCategoryId(categoryId);
        this.categoryIds.add(categoryId);
    }

    public void removeFromCategory(Long categoryId) {
        this.categoryIds.remove(categoryId);
    }

    // =========================================================================
    // BUSINESS METHODS - Price Management
    // =========================================================================

    public void changePrice(BigDecimal newPrice) {
        validatePrice(newPrice, "Giá");
        this.price = newPrice;
    }

    public void applyDiscount(BigDecimal discountPrice) {
        validatePrice(discountPrice, "Giá khuyến mãi");
        validateDiscountLowerThanPrice(discountPrice);
        this.discountPrice = discountPrice;
    }

    public void cancelDiscount() {
        this.discountPrice = null;
    }

    // =========================================================================
    // BUSINESS METHODS - Image Management
    // =========================================================================

    public void addImage(String url) {
        validateImageLimit();
        this.images.add(url);
    }

    public void setImages(List<String> images) {
        if (images != null && images.size() > 5) {
            throw new IllegalArgumentException("Tối đa 5 ảnh");
        }
        this.images = images != null ? images : new ArrayList<>();
    }

    // =========================================================================
    // BUSINESS METHODS - Review Management
    // =========================================================================

    public void addReview(Review review) {
        this.reviews.add(review);
        recalculateRating();
    }

    private void recalculateRating() {
        if (reviews.isEmpty()) {
            this.averageRating = 0.0;
            this.reviewCount = 0;
            return;
        }

        int totalRating = reviews.stream()
                .mapToInt(Review::getRating)
                .sum();

        this.reviewCount = reviews.size();
        this.averageRating = (double) totalRating / reviewCount;
    }

    // =========================================================================
    // PRIVATE VALIDATION HELPERS
    // =========================================================================

    private void validateCategoryId(Long categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("Category ID không được null");
        }
    }

    private void validatePrice(BigDecimal price, String fieldName) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(fieldName + " phải lớn hơn 0");
        }
    }

    private void validateDiscountLowerThanPrice(BigDecimal discountPrice) {
        if (discountPrice.compareTo(this.price) >= 0) {
            throw new IllegalArgumentException("Giá khuyến mãi phải nhỏ hơn giá gốc");
        }
    }

    private void validateImageLimit() {
        if (this.images.size() >= 5) {
            throw new IllegalStateException("Một sản phẩm chỉ được tối đa 5 ảnh");
        }
    }

    // =========================================================================
    // PROTECTED ACCESS (Immutable Collections)
    // =========================================================================

    public Set<Long> getCategoryIds() {
        return Collections.unmodifiableSet(categoryIds);
    }

    public List<Review> getReviews() {
        return Collections.unmodifiableList(reviews);
    }
}