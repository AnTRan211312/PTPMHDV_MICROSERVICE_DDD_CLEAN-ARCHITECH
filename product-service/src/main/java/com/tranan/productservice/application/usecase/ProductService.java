package com.tranan.productservice.application.usecase;

import com.tranan.productservice.application.dto.request.CreateProductRequest;
import com.tranan.productservice.application.dto.request.UpdateProductRequest;
import com.tranan.productservice.application.dto.response.ProductResponse;
import com.tranan.productservice.domain.model.Category;
import com.tranan.productservice.domain.model.Product;
import com.tranan.productservice.domain.repository.CategoryRepository;
import com.tranan.productservice.domain.repository.ProductRepository;
import com.tranan.productservice.infrastructure.config.network.S3Service;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final S3Service s3Service;

    // =========================================================================
    // CREATE - Với file upload
    // =========================================================================

    @CacheEvict(value = "allProducts", allEntries = true)
    @Transactional
    public ProductResponse addProduct(
            CreateProductRequest request,
            MultipartFile thumbnailFile,
            List<MultipartFile> imageFiles) {

        log.info("Creating product: {}", request.getName());

        // 1. Validate categories
        List<Category> categories = validateAndLoadCategories(request.getCategoryIds());

        // 2. Upload thumbnail lên S3
        String thumbnailUrl = uploadThumbnail(thumbnailFile);

        // 3. Upload images lên S3 (nếu có)
        List<String> imageUrls = uploadImages(imageFiles);

        // 4. Create product domain
        Product product = Product.createProduct(
                request.getName(),
                request.getDescription(),
                request.getPrice(),
                thumbnailUrl);

        // 5. Apply optional fields
        if (request.getDiscountPrice() != null) {
            product.applyDiscount(request.getDiscountPrice());
        }

        request.getCategoryIds().forEach(product::assignToCategory);

        if (!imageUrls.isEmpty()) {
            product.setImages(imageUrls);
        }

        // 6. Save and return
        Product savedProduct = productRepository.save(product);
        log.info("Product created with ID: {}", savedProduct.getId());

        return mapToResponse(savedProduct, categories);
    }

    // =========================================================================
    // UPDATE - Với file upload
    // =========================================================================

    @CacheEvict(value = { "products", "allProducts" }, allEntries = true, key = "#productId")
    @Transactional
    public ProductResponse updateProduct(
            Long productId,
            UpdateProductRequest request,
            MultipartFile thumbnailFile,
            List<MultipartFile> imageFiles) {

        log.info("Updating product with ID: {}", productId);

        Product product = findProductById(productId);

        // Lưu ảnh cũ để xóa sau
        String oldThumbnail = product.getThumbnail();
        List<String> oldImages = new ArrayList<>(product.getImages());

        // 1. Validate categories (chỉ validate nếu có gửi categoryIds mới)
        List<Category> categories;
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            categories = validateAndLoadCategories(request.getCategoryIds());
        } else {
            // Giữ nguyên categories cũ
            categories = categoryRepository.findAllById(product.getCategoryIds());
        }

        // 2. Update thumbnail nếu có file mới
        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            String newThumbnailUrl = uploadThumbnail(thumbnailFile);
            product.updateThumbnail(newThumbnailUrl);
        }

        // 3. Update images (Merge Logic)
        List<String> keptImages = request.getKeptImages();
        boolean hasImageUpdate = keptImages != null || (imageFiles != null && !imageFiles.isEmpty());

        if (hasImageUpdate) {
            List<String> finalImages = new ArrayList<>();

            if (keptImages != null) {
                finalImages.addAll(keptImages);
            }

            if (imageFiles != null && !imageFiles.isEmpty()) {
                List<String> newUrls = uploadImages(imageFiles);
                finalImages.addAll(newUrls);
            }

            // Validate total limit
            if (finalImages.size() > 5) {
                throw new IllegalArgumentException(
                        "Tổng số ảnh không được vượt quá 5. Hiện tại: " + finalImages.size());
            }

            product.updateImages(finalImages);

            // Calculate images to delete (Old Images NOT in Final Images)
            List<String> imagesToDelete = new ArrayList<>(oldImages);
            imagesToDelete.removeAll(finalImages);

            if (!imagesToDelete.isEmpty()) {
                cleanupOldImagesAsync(null, imagesToDelete, null);
            }
        }

        // 4. Update basic info
        product.updateBasicInfo(request.getName(), request.getDescription(), request.getPrice());

        if (request.getDiscountPrice() != null) {
            product.updateDiscount(request.getDiscountPrice());
        }

        // 5. Update categories (chỉ update nếu có gửi categoryIds mới)
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            product.updateCategories(request.getCategoryIds());
        }

        // 6. Save
        Product updatedProduct = productRepository.save(product);

        // 7. Cleanup old thumbnail if changed
        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            cleanupOldImagesAsync(oldThumbnail, null, null);
        }

        return mapToResponse(updatedProduct, categories);
    }

    // =========================================================================
    // PRIVATE HELPERS - File Upload
    // =========================================================================

    private String uploadThumbnail(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Thumbnail file là bắt buộc");
        }

        try {
            String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
            String url = s3Service.uploadFile(file, "products/thumbnails", fileName, true);
            log.info("Uploaded thumbnail: {}", url);
            return url;
        } catch (Exception e) {
            log.error("Failed to upload thumbnail", e);
            throw new RuntimeException("Lỗi khi upload thumbnail lên S3", e);
        }
    }

    private List<String> uploadImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }

        if (files.size() > 5) {
            throw new IllegalArgumentException("Tối đa 5 ảnh chi tiết");
        }

        try {
            List<String> urls = s3Service.uploadMultiFile(files, "products/images", true);
            log.info("Uploaded {} images", urls.size());
            return urls;
        } catch (Exception e) {
            log.error("Failed to upload images", e);
            throw new RuntimeException("Lỗi khi upload ảnh lên S3", e);
        }
    }

    @Async
    public void cleanupOldImagesAsync(String oldThumbnail, List<String> oldImages, Product newProduct) {
        try {
            if (oldThumbnail != null && !oldThumbnail.isBlank()) {
                s3Service.deleteFileByUrl(oldThumbnail);
                log.info("Deleted old thumbnail: {}", oldThumbnail);
            }

            if (oldImages != null) {
                for (String oldImg : oldImages) {
                    if (oldImg != null && !oldImg.isBlank()) {
                        s3Service.deleteFileByUrl(oldImg);
                        log.info("Deleted old image: {}", oldImg);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error cleaning up old images", e);
        }
    }

    // =========================================================================
    // READ METHODS (giữ nguyên như cũ)
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(String keyword, Pageable pageable) {
        Page<Product> productPage = productRepository.searchProducts(keyword, pageable);

        if (productPage.isEmpty()) {
            return Page.empty(pageable);
        }

        Set<Long> allCategoryIds = productPage.getContent().stream()
                .map(Product::getCategoryIds)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());

        Map<Long, Category> categoryMap = categoryRepository.findAllById(allCategoryIds)
                .stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        return productPage.map(product -> {
            List<Category> categoriesOfProduct = new ArrayList<>();
            if (product.getCategoryIds() != null) {
                product.getCategoryIds().forEach(id -> {
                    Category cat = categoryMap.get(id);
                    if (cat != null)
                        categoriesOfProduct.add(cat);
                });
            }
            return mapToResponse(product, categoriesOfProduct);
        });
    }

    /**
     * Advanced search with category and price filters
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProductsAdvanced(
            String keyword,
            List<Long> categoryIds,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Pageable pageable) {

        Page<Product> productPage = productRepository.searchProductsAdvanced(
                keyword, categoryIds, minPrice, maxPrice, pageable);

        if (productPage.isEmpty()) {
            return Page.empty(pageable);
        }

        Set<Long> allCategoryIds = productPage.getContent().stream()
                .map(Product::getCategoryIds)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());

        Map<Long, Category> categoryMap = categoryRepository.findAllById(allCategoryIds)
                .stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        return productPage.map(product -> {
            List<Category> categoriesOfProduct = new ArrayList<>();
            if (product.getCategoryIds() != null) {
                product.getCategoryIds().forEach(id -> {
                    Category cat = categoryMap.get(id);
                    if (cat != null)
                        categoriesOfProduct.add(cat);
                });
            }
            return mapToResponse(product, categoriesOfProduct);
        });
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = findProductById(id);
        List<Category> categories = categoryRepository.findAllById(product.getCategoryIds());
        return mapToResponse(product, categories);
    }

    @CacheEvict(value = { "products", "allProducts" }, allEntries = true, key = "#id")
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findProductById(id);

        String oldThumbnail = product.getThumbnail();
        List<String> oldImages = new ArrayList<>(product.getImages());

        productRepository.deleteById(id);

        cleanupOldImagesAsync(oldThumbnail, oldImages, null);
        log.info("Product deleted with ID: {}", id);
    }

    // =========================================================================
    // PRIVATE HELPERS (giữ nguyên)
    // =========================================================================

    private List<Category> validateAndLoadCategories(Set<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new IllegalArgumentException("Sản phẩm phải thuộc ít nhất 1 danh mục");
        }

        List<Category> categories = categoryRepository.findAllById(categoryIds);

        if (categories.size() != categoryIds.size()) {
            Set<Long> foundIds = categories.stream()
                    .map(Category::getId)
                    .collect(Collectors.toSet());

            Set<Long> missingIds = new HashSet<>(categoryIds);
            missingIds.removeAll(foundIds);

            throw new EntityNotFoundException("Categories không tồn tại: " + missingIds);
        }

        return categories;
    }

    private Product findProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Product not found with ID: " + productId));
    }

    private ProductResponse mapToResponse(Product product, List<Category> categories) {
        ProductResponse response = new ProductResponse();

        response.setId(product.getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setDiscountPrice(product.getDiscountPrice());
        response.setThumbnail(product.getThumbnail());
        response.setImages(product.getImages());
        response.setAverageRating(product.getAverageRating());
        response.setReviewCount((long) product.getReviewCount());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        Set<ProductResponse.CategoryDto> categoryDtos = categories.stream()
                .map(cat -> new ProductResponse.CategoryDto(
                        cat.getId(),
                        cat.getName(),
                        cat.getDescription()))
                .collect(Collectors.toSet());
        response.setCategories(categoryDtos);

        List<ProductResponse.ReviewDto> reviewDtos = product.getReviews().stream()
                .map(review -> new ProductResponse.ReviewDto(
                        review.getId(),
                        review.getUserEmail(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt()))
                .toList();
        response.setReviews(reviewDtos);

        return response;
    }

    // =========================================================================
    // BATCH OPERATIONS (Internal API)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        log.info("Getting {} products by IDs", ids.size());
        List<Product> products = productRepository.findAllById(ids);

        // Get all categories for these products
        Set<Long> allCategoryIds = products.stream()
                .map(Product::getCategoryIds)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());

        Map<Long, Category> categoryMap = categoryRepository.findAllById(allCategoryIds)
                .stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        return products.stream()
                .map(product -> {
                    List<Category> categoriesOfProduct = new ArrayList<>();
                    if (product.getCategoryIds() != null) {
                        product.getCategoryIds().forEach(id -> {
                            Category cat = categoryMap.get(id);
                            if (cat != null)
                                categoriesOfProduct.add(cat);
                        });
                    }
                    return mapToResponse(product, categoriesOfProduct);
                })
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm product IDs theo tên sản phẩm (cho internal API)
     */
    @Transactional(readOnly = true)
    public List<Long> searchProductIdsByName(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return productRepository.findIdsByNameContaining(keyword.trim());
    }

    // =========================================================================
    // DASHBOARD STATISTICS (Admin API)
    // =========================================================================

    /**
     * Lấy thống kê sản phẩm cho Dashboard Admin
     */
    @Transactional(readOnly = true)
    public com.tranan.productservice.application.dto.response.ProductStatsResponse getProductStats() {
        log.info("Getting product statistics for dashboard");

        long totalProducts = productRepository.count();

        // Lấy top 5 sản phẩm bán chạy (theo reviewCount)
        List<Product> topProducts = productRepository.findTopByReviewCount(5);

        List<com.tranan.productservice.application.dto.response.ProductStatsResponse.TopProduct> topProductList = topProducts
                .stream()
                .map(product -> com.tranan.productservice.application.dto.response.ProductStatsResponse.TopProduct
                        .builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .thumbnail(product.getThumbnail())
                        .salesCount(product.getReviewCount()) // Sử dụng reviewCount làm proxy cho sales
                        .averageRating(product.getAverageRating())
                        .build())
                .collect(Collectors.toList());

        return com.tranan.productservice.application.dto.response.ProductStatsResponse.builder()
                .totalProducts(totalProducts)
                .topProducts(topProductList)
                .build();
    }
}