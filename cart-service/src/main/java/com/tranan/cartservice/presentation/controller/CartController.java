package com.tranan.cartservice.presentation.controller;

import com.tranan.cartservice.annotation.ApiMessage;
import com.tranan.cartservice.application.dto.request.AddToCartRequest;
import com.tranan.cartservice.application.dto.request.UpdateCartItemRequest;
import com.tranan.cartservice.application.dto.response.CartResponse;
import com.tranan.cartservice.application.usecase.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/carts")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Quản lý giỏ hàng")
public class CartController {

    private final CartService cartService;

    /**
     * Lấy userId từ JWT token claims
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.error("Authentication is null");
            throw new IllegalArgumentException("User not authenticated");
        }
        
        log.debug("Authentication type: {}", auth.getClass().getName());
        log.debug("Principal type: {}", auth.getPrincipal().getClass().getName());
        
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) auth.getPrincipal();
            log.debug("JWT claims: {}", jwt.getClaims());
            
            Object userIdObj = jwt.getClaim("userId");
            if (userIdObj != null) {
                if (userIdObj instanceof Number) {
                    return ((Number) userIdObj).longValue();
                } else if (userIdObj instanceof String) {
                    return Long.parseLong((String) userIdObj);
                }
            }
            log.error("userId claim not found or invalid in JWT");
        } else {
            log.error("Principal is not JWT: {}", auth.getPrincipal().getClass().getSimpleName());
        }
        
        throw new IllegalArgumentException("User not authenticated or userId not found in token");
    }

    /**
     * Lấy giỏ hàng của người dùng hiện tại
     * GET /api/carts/my
     */
    @GetMapping("/my")
    @ApiMessage("Lấy giỏ hàng của người dùng hiện tại")
    @Operation(
            summary = "Lấy giỏ hàng của người dùng hiện tại"
    )
    public ResponseEntity<CartResponse> getMyCart() {
        Long userId = getCurrentUserId();
        log.info("Request: GET my cart - userId: {}", userId);
        CartResponse response = cartService.getCart(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     * POST /api/carts/my/items
     */
    @PostMapping("/my/items")
    @ApiMessage("Thêm sản phẩm vào giỏ hàng")
    @Operation(
            summary = "Thêm sản phẩm vào giỏ hàng"
    )
    public ResponseEntity<CartResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request) {

        Long userId = getCurrentUserId();
        log.info("Request: ADD to cart - userId: {}, productId: {}, quantity: {}",
                userId, request.getProductId(), request.getQuantity());

        CartResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật số lượng của một sản phẩm trong giỏ
     * PUT /api/carts/my/items
     */
    @PutMapping("/my/items")
    @ApiMessage("cập nhật giỏ hàng của người dùng hiện tại")
    @Operation(
            summary = "Cập nhật giỏ hàng của người dùng hiện tại"
    )
    public ResponseEntity<CartResponse> updateCartItem(
            @Valid @RequestBody UpdateCartItemRequest request) {

        Long userId = getCurrentUserId();


        CartResponse response = cartService.updateCartItem(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa một sản phẩm khỏi giỏ hàng
     * DELETE /api/carts/my/items
     */
    @DeleteMapping("/my/items")
    @ApiMessage("Xóa 1 sản phẩm trong giỏ hàng của người dùng hiện tại")
    @Operation(
            summary = "Xóa 1 sản phẩm trong giỏ hàng của người dùng hiện tại"
    )
    public ResponseEntity<CartResponse> removeFromCart(
            @Valid @RequestBody UpdateCartItemRequest request) {

        Long userId = getCurrentUserId();
        log.info("Request: REMOVE from cart - userId: {}, productId: {}", userId, request.getProductId());

        CartResponse response = cartService.removeFromCart(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa toàn bộ giỏ hàng
     * DELETE /api/carts/my
     */
    @DeleteMapping("/my")
    @ApiMessage("Xóa toàn bộ giỏ hàng của người dùng hiện tại")
    @Operation(
            summary = "Xóa toàn bộ giỏ hàng của người dùng hiện tại"
    )
    public ResponseEntity<Void> clearCart() {
        Long userId = getCurrentUserId();
        log.info("Request: CLEAR cart - userId: {}", userId);

        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}