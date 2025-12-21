package com.tranan.cartservice.infrastructure.client.internal;

import com.tranan.cartservice.application.dto.response.CartResponse;
import com.tranan.cartservice.application.usecase.CartService;
import com.tranan.cartservice.infrastructure.client.dto.CartTotalResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Internal Cart API - Dùng cho các service khác gọi
 * Không yêu cầu authentication
 */
@Slf4j
@RestController
@RequestMapping("/api/carts/internal")
@RequiredArgsConstructor
@Tag(name = "Internal Cart API", description = "API nội bộ dùng để các service khác quản lý giỏ hàng")
public class InternalCartController {

    private final CartService cartService;

    /**
     * Lấy giỏ hàng của user (internal API)
     * GET /api/carts/internal/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<CartResponse> getCartByUserId(@PathVariable Long userId) {
        log.info("[InternalCartController] Getting cart for userId: {}", userId);
        CartResponse response = cartService.getCart(userId);
        return ResponseEntity.ok(response);
    }



    /**
     * Xóa các items cụ thể khỏi giỏ hàng (internal API)
     * DELETE /api/carts/internal/{userId}/items?itemIds=1,2,3
     */
    @DeleteMapping("/{userId}/items")
    public ResponseEntity<Void> removeCartItems(
            @PathVariable Long userId,
            @RequestParam List<Long> itemIds) {
        log.info("[InternalCartController] Removing items {} from cart for userId: {}", itemIds, userId);
        cartService.removeCartItems(userId, itemIds);
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa các items theo productIds khỏi giỏ hàng (internal API)
     * DELETE /api/carts/internal/{userId}/items/products?productIds=1,2,3
     */
    @DeleteMapping("/{userId}/items/products")
    public ResponseEntity<Void> removeCartItemsByProductIds(
            @PathVariable Long userId,
            @RequestParam List<Long> productIds) {
        log.info("[InternalCartController] Removing items with productIds {} from cart for userId: {}", productIds, userId);
        cartService.removeCartItemsByProductIds(userId, productIds);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy tổng tiền giỏ hàng (internal API)
     * GET /api/carts/internal/{userId}/total
     */
    @GetMapping("/{userId}/total")
    public ResponseEntity<CartTotalResponse> getCartTotal(@PathVariable Long userId) {
        log.info("[InternalCartController] Getting cart total for userId: {}", userId);
        CartResponse cart = cartService.getCart(userId);
        CartTotalResponse response = CartTotalResponse.builder()
                .userId(userId)
                .totalAmount(cart.getTotalAmount())
                .totalItems(cart.getTotalItems())
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * Kiểm tra giỏ hàng có trống không (internal API)
     * GET /api/carts/internal/{userId}/empty
     */
    @GetMapping("/{userId}/empty")
    public ResponseEntity<Boolean> isCartEmpty(@PathVariable Long userId) {
        log.info("[InternalCartController] Checking if cart is empty for userId: {}", userId);
        CartResponse cart = cartService.getCart(userId);
        boolean isEmpty = cart.getItems() == null || cart.getItems().isEmpty();
        return ResponseEntity.ok(isEmpty);
    }

    /**
     * Lấy số lượng items trong giỏ hàng (internal API)
     * GET /api/carts/internal/{userId}/count
     */
    @GetMapping("/{userId}/count")
    public ResponseEntity<Integer> getCartItemCount(@PathVariable Long userId) {
        log.info("[InternalCartController] Getting cart item count for userId: {}", userId);
        CartResponse cart = cartService.getCart(userId);
        int count = cart.getTotalItems() != null ? cart.getTotalItems() : 0;
        return ResponseEntity.ok(count);
    }

    /**
     * Xóa giỏ hàng theo userId (Internal API)
     * DELETE /api/carts/internal/{userId}
     */
    @DeleteMapping("/{userId}")
    @Operation(summary = "Xóa giỏ hàng theo userId (Internal)")
    public ResponseEntity<Void> clearCartByUserId(@PathVariable Long userId) {
        log.info("Internal Request: CLEAR cart - userId: {}", userId);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
