package com.tranan.cartservice.application.usecase;

import com.tranan.cartservice.application.dto.request.AddToCartRequest;
import com.tranan.cartservice.application.dto.request.UpdateCartItemRequest;
import com.tranan.cartservice.application.dto.response.CartItemResponse;
import com.tranan.cartservice.application.dto.response.CartResponse;
import com.tranan.cartservice.domain.model.Cart;
import com.tranan.cartservice.domain.model.CartItem;
import com.tranan.cartservice.domain.repository.CartRepository;
import com.tranan.cartservice.infrastructure.client.client.InventoryServiceClient;
import com.tranan.cartservice.infrastructure.client.client.ProductServiceClient;
import com.tranan.cartservice.infrastructure.client.dto.InventoryQuantityResponse;
import com.tranan.cartservice.infrastructure.client.dto.ProductDTO;
import com.tranan.cartservice.infrastructure.event.CartAnalyticsEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final ProductServiceClient productServiceClient;
    private final InventoryServiceClient inventoryServiceClient;
    private final KafkaTemplate<String, CartAnalyticsEvent> kafkaTemplate;

    // ==========================================
    // 1. LẤY GIỎ HÀNG
    // ==========================================
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("No cart found for userId {}. Creating new empty cart.", userId);
                    return new Cart(userId);
                });

        // Enrich cart items với description và thumbnail từ Product Service
        return mapToCartResponseWithEnrichment(cart);
    }

    /**
     * Map Cart to CartResponse với enrichment từ Product Service
     * Lấy description và thumbnail từ Product Service cho mỗi item
     */
    private CartResponse mapToCartResponseWithEnrichment(Cart cart) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return CartResponse.builder()
                    .cartId(cart.getId())
                    .userId(cart.getUserId())
                    .items(java.util.Collections.emptyList())
                    .totalItems(0)
                    .totalAmount(BigDecimal.ZERO)
                    .build();
        }

        // Lấy tất cả productIds
        List<Long> productIds = cart.getItems().stream()
                .map(CartItem::getProductId)
                .collect(java.util.stream.Collectors.toList());

        // Gọi Product Service để lấy thông tin mới nhất (từng product một vì chưa có batch API)
        java.util.Map<Long, ProductDTO> productMap = new java.util.HashMap<>();
        for (Long productId : productIds) {
            try {
                ProductDTO product = productServiceClient.getProduct(productId);
                if (product != null) {
                    productMap.put(productId, product);
                }
            } catch (Exception e) {
                log.warn("Failed to get product {} for enrichment: {}", productId, e.getMessage());
            }
        }

        // Map items với enrichment
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(item -> {
                    ProductDTO product = productMap.get(item.getProductId());
                    BigDecimal effectivePrice = item.getEffectivePrice();
                    
                    return CartItemResponse.builder()
                            .productId(item.getProductId())
                            .productName(item.getProductName())
                            .productDescription(product != null ? product.getDescription() : null)
                            .productImage(product != null ? product.getThumbnail() : null)
                            .originalPrice(item.getPrice())
                            .discountPrice(item.getDiscountPrice())
                            .effectivePrice(effectivePrice)
                            .quantity(item.getQuantity())
                            .subtotal(effectivePrice.multiply(BigDecimal.valueOf(item.getQuantity())))
                            .build();
                })
                .toList();

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalItems(cart.getTotalItemCount())
                .totalAmount(cart.getTotalAmount())
                .build();
    }

    // ==========================================
    // 2. THÊM SẢN PHẨM VÀO GIỎ
    // ==========================================
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        Long productId = request.getProductId();
        int requestedQuantity = request.getQuantity();

        // 1. Lấy thông tin sản phẩm mới nhất từ Product Service
        ProductDTO product = productServiceClient.getProduct(productId);

        if (product.getAvailable() == null || !product.getAvailable()) {
            throw new IllegalArgumentException("Sản phẩm không khả dụng để bán.");
        }

        // 2. Kiểm tra tồn kho từ Inventory Service
        InventoryQuantityResponse inventoryResp = inventoryServiceClient.getQuantity(productId);
        int availableStock = inventoryResp.getQuantity() != null ? inventoryResp.getQuantity() : 0;

        if (availableStock <= 0) {
            throw new IllegalArgumentException("Sản phẩm đã hết hàng.");
        }

        // 3. Lấy giỏ hàng hiện tại
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> new Cart(userId));

        // 4. Tính số lượng hiện có trong giỏ
        int currentInCart = cart.getItems().stream()
                .filter(item -> item.isSameProduct(productId))
                .mapToInt(CartItem::getQuantity)
                .sum();

        int totalRequested = currentInCart + requestedQuantity;

        if (totalRequested > availableStock) {
            throw new IllegalArgumentException(
                    String.format("Không đủ hàng. Chỉ còn %d sản phẩm trong kho (bạn đang có %d trong giỏ).",
                            availableStock, currentInCart)
            );
        }

        // 5. Thêm vào giỏ (luôn cập nhật giá & tên mới nhất)
        cart.addItem(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getThumbnail(),
                product.getPrice(),
                product.getDiscountPrice(),
                requestedQuantity
        );

        // 6. Lưu giỏ hàng và gán ID trở lại
        cart = cartRepository.save(cart);
        log.info("Added {} units of product {} to cart of user {}", requestedQuantity, productId, userId);

        // 7. Publish analytics event asynchronously (fire-and-forget)
        publishAddToCartEvent(userId, product, requestedQuantity);

        return mapToCartResponseWithEnrichment(cart);
    }

    // ==========================================
    // 3. CẬP NHẬT SỐ LƯỢNG ITEM
    // ==========================================
    public CartResponse updateCartItem(Long userId, UpdateCartItemRequest request) {
        Long productId = request.getProductId();
        
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng của người dùng."));

        // Kiểm tra sản phẩm có trong giỏ không
        boolean existsInCart = cart.getItems().stream()
                .anyMatch(item -> item.isSameProduct(productId));

        if (!existsInCart) {
            throw new IllegalArgumentException("Sản phẩm không tồn tại trong giỏ hàng.");
        }

        // Kiểm tra tồn kho mới nhất
        InventoryQuantityResponse inventoryResp = inventoryServiceClient.getQuantity(productId);
        int availableStock = inventoryResp.getQuantity() != null ? inventoryResp.getQuantity() : 0;

        if (request.getQuantity() > availableStock) {
            throw new IllegalArgumentException(
                    String.format("Không đủ hàng. Chỉ còn %d sản phẩm trong kho.", availableStock)
            );
        }

        cart.updateItemQuantity(productId, request.getQuantity());
        cart = cartRepository.save(cart);

        log.info("Updated quantity of product {} to {} in cart of user {}", productId, request.getQuantity(), userId);

        return mapToCartResponseWithEnrichment(cart);
    }

    // ==========================================
    // 4. XÓA ITEM KHỎI GIỎ
    // ==========================================
    public CartResponse removeFromCart(Long userId, UpdateCartItemRequest request) {
        Long productId = request.getProductId();
        
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));

        cart.removeItem(productId);
        cart = cartRepository.save(cart);

        log.info("Removed product {} from cart of user {}", productId, userId);

        return mapToCartResponseWithEnrichment(cart);
    }

    // ==========================================
    // 5. XÓA TOÀN BỘ GIỎ HÀNG
    // ==========================================
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));

        cart.clear();
        cartRepository.save(cart);

        log.info("Cleared cart for user {}", userId);
    }

    // ==========================================
    // 6. XÓA NHIỀU ITEMS KHỎI GIỎ HÀNG
    // ==========================================
    public void removeCartItems(Long userId, List<Long> productIds) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));

        for (Long productId : productIds) {
            cart.removeItem(productId);
        }

        cartRepository.save(cart);
        log.info("Removed {} items from cart of user {}", productIds.size(), userId);
    }

    // ==========================================
    // 7. XÓA ITEMS THEO PRODUCT IDS
    // ==========================================
    public void removeCartItemsByProductIds(Long userId, List<Long> productIds) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));

        for (Long productId : productIds) {
            cart.removeItem(productId);
        }

        cartRepository.save(cart);
        log.info("Removed {} items by productIds from cart of user {}", productIds.size(), userId);
    }

    // ==========================================
    // HELPER: Mapping Cart → CartResponse
    // ==========================================
    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(this::mapToCartItemResponse)
                .toList();

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalItems(cart.getTotalItemCount())
                .totalAmount(cart.getTotalAmount())
                .build();
    }

    private CartItemResponse mapToCartItemResponse(CartItem item) {
        BigDecimal effectivePrice = item.getEffectivePrice();

        return CartItemResponse.builder()
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productDescription(item.getProductDescription())
                .productImage(item.getProductImage())
                .originalPrice(item.getPrice())
                .discountPrice(item.getDiscountPrice())
                .effectivePrice(effectivePrice)
                .quantity(item.getQuantity())
                .subtotal(effectivePrice.multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }

    // ==========================================
    // HELPER: Publish Analytics Event (Async)
    // ==========================================
    private void publishAddToCartEvent(Long userId, ProductDTO product, Integer quantity) {
        try {
            CartAnalyticsEvent event = CartAnalyticsEvent.builder()
                    .eventType("ADD_TO_CART")
                    .userId(userId)
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(quantity)
                    .effectivePrice(product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice())
                    .timestamp(Instant.now())
                    .build();

            // Send async with callback (fire-and-forget, non-blocking)
            kafkaTemplate.send("cart-analytics-events", String.valueOf(userId), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.debug("Analytics event published successfully for userId: {}, productId: {}", userId, product.getId());
                        } else {
                            log.error("Failed to publish analytics event for userId: {}, productId: {}", userId, product.getId(), ex);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing analytics event for userId: {}, productId: {}", userId, product.getId(), e);
            // Don't throw exception - analytics is non-critical
        }
    }
}