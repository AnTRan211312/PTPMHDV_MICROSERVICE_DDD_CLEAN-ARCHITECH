package com.tranan.orderservice.infrastructure.client.internal;

import com.tranan.orderservice.application.dto.response.OrderResponse;
import com.tranan.orderservice.application.usecase.OrderService;
import com.tranan.orderservice.infrastructure.client.dto.OrderTotalResponse;
import com.tranan.orderservice.infrastructure.client.dto.UpdateOrderStatusRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Internal Order API - Dùng cho các service khác gọi
 * Không yêu cầu authentication
 */
@Slf4j
@RestController
@RequestMapping("/api/orders/internal")
@RequiredArgsConstructor
@Tag(name = "Internal Order API", description = "API nội bộ dùng để các service khác quản lý đơn hàng")
public class InternalOrderController {

    private final OrderService orderService;

    /**
     * Lấy chi tiết đơn hàng theo orderId
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        log.info("[InternalOrderController] Getting order details for orderId: {}", orderId);
        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách đơn hàng của user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByUserId(@PathVariable Long userId) {
        log.info("[InternalOrderController] Getting orders for userId: {}", userId);
        List<OrderResponse> response = orderService.getOrdersByUserId(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật status đơn hàng
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequest request) {
        log.info("[InternalOrderController] Updating order {} status to: {}", orderId, request.getStatus());
        OrderResponse response = orderService.updateOrderStatus(orderId, request.getStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * Kiểm tra xem đơn hàng có tồn tại không
     */
    @GetMapping("/{orderId}/exists")
    public ResponseEntity<Boolean> orderExists(@PathVariable Long orderId) {
        log.info("[InternalOrderController] Checking if order {} exists", orderId);
        boolean exists = orderService.orderExists(orderId);
        return ResponseEntity.ok(exists);
    }

    /**
     * Lấy tổng tiền của đơn hàng
     */
    @GetMapping("/{orderId}/total")
    public ResponseEntity<OrderTotalResponse> getOrderTotal(@PathVariable Long orderId) {
        log.info("[InternalOrderController] Getting total amount for orderId: {}", orderId);
        OrderTotalResponse response = orderService.getOrderTotal(orderId);
        return ResponseEntity.ok(response);
    }
}