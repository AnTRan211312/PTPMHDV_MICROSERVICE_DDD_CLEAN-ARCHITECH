package com.tranan.orderservice.presentation.controller;

import com.tranan.orderservice.annotation.ApiMessage;
import com.tranan.orderservice.application.dto.response.OrderResponse;
import com.tranan.orderservice.application.usecase.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order", description = "Quản lý đơn hàng")
public class OrderController {

    private final OrderService orderService;

    /**
     * Lấy userId từ JWT token claims
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null) {
            log.error("Authentication is null");
            throw new IllegalArgumentException("User not authenticated");
        }

        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) auth
                    .getPrincipal();

            Object userIdObj = jwt.getClaim("userId");
            if (userIdObj != null) {
                if (userIdObj instanceof Number) {
                    return ((Number) userIdObj).longValue();
                } else if (userIdObj instanceof String) {
                    return Long.parseLong((String) userIdObj);
                }
            }
            log.error("userId claim not found or invalid in JWT");
        }

        throw new IllegalArgumentException("User not authenticated or userId not found in token");
    }

    /**
     * Tạo đơn hàng từ giỏ hàng (tất cả items)
     * POST /api/orders/checkout
     */
    @PostMapping("/checkout")
    @ApiMessage("Tạo đơn hàng từ giỏ hàng")
    @Operation(summary = "Tạo đơn hàng từ tất cả items trong giỏ hàng")
    public ResponseEntity<OrderResponse> checkout() {
        Long userId = getCurrentUserId();
        log.info("Request: CHECKOUT - userId: {}", userId);

        OrderResponse response = orderService.createOrder(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Tạo đơn hàng từ giỏ hàng (chọn items cụ thể)
     * POST /api/orders/checkout-selected
     * Body: { "productIds": [1, 2, 3] }
     */
    @PostMapping("/checkout-selected")
    @ApiMessage("Tạo đơn hàng từ items được chọn")
    @Operation(summary = "Tạo đơn hàng từ các items được chọn trong giỏ hàng")
    public ResponseEntity<OrderResponse> checkoutSelected(@RequestBody CheckoutSelectedRequest request) {
        Long userId = getCurrentUserId();
        log.info("Request: CHECKOUT_SELECTED - userId: {}, productIds: {}", userId, request.getProductIds());

        OrderResponse response = orderService.createOrderWithSelectedItems(userId, request.getProductIds());
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy chi tiết đơn hàng
     * GET /api/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    @ApiMessage("Lấy chi tiết đơn hàng")
    @Operation(summary = "Lấy chi tiết đơn hàng")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long orderId) {
        Long userId = getCurrentUserId();
        log.info("Request: GET order {} - userId: {}", orderId, userId);

        OrderResponse response = orderService.getOrder(userId, orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Hủy đơn hàng
     * POST /api/orders/{orderId}/cancel
     */
    @PostMapping("/{orderId}/cancel")
    @ApiMessage("Hủy đơn hàng")
    @Operation(summary = "Hủy đơn hàng (chỉ đơn hàng chưa thanh toán)")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long orderId) {
        Long userId = getCurrentUserId();
        log.info("Request: CANCEL order {} - userId: {}", orderId, userId);

        OrderResponse response = orderService.cancelOrder(userId, orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy lịch sử đơn hàng (tất cả status)
     * GET /api/orders/history?page=0&size=10
     */
    @GetMapping("/history")
    @ApiMessage("Lấy lịch sử đơn hàng")
    @Operation(summary = "Lấy lịch sử tất cả đơn hàng của user")
    public ResponseEntity<Page<OrderResponse>> getOrderHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        log.info("Request: GET order history - userId: {}, page: {}, size: {}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> response = orderService.getOrderHistory(userId, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách đơn hàng theo status
     * GET /api/orders/status/{status}?page=0&size=10
     */
    @GetMapping("/status/{status}")
    @ApiMessage("Lấy đơn hàng theo trạng thái")
    @Operation(summary = "Lấy danh sách đơn hàng theo trạng thái")
    public ResponseEntity<Page<OrderResponse>> getOrdersByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        log.info("Request: GET orders by status {} - userId: {}, page: {}, size: {}", status, userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> response = orderService.getOrdersByStatus(userId, status, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách đơn hàng theo status (Admin - All Users)
     * GET /api/orders/admin/status/{status}?page=0&size=10
     */
    @GetMapping("/admin/status/{status}")
    @ApiMessage("Lấy đơn hàng theo trạng thái (Admin)")
    @PreAuthorize("hasAuthority('GET /api/orders/admin/status/{status}')")
    @Operation(summary = "Lấy danh sách đơn hàng theo trạng thái", description = "Yêu cầu quyền: <b>GET /api/orders/admin/status/{status}</b>")
    public ResponseEntity<Page<OrderResponse>> getOrdersByStatusAdmin(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Request: GET orders by status (ADMIN) {} - page: {}, size: {}", status, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> response = orderService.getOrdersByStatusForAdmin(status, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy tất cả đơn hàng trên hệ thống (Admin only)
     * GET /api/orders/admin/all?page=0&size=10&keyword=ORD
     * Hỗ trợ tìm kiếm theo mã đơn hàng (keyword)
     */
    @GetMapping("/admin/all")
    @ApiMessage("Lấy tất cả đơn hàng (Admin)")
    @PreAuthorize("hasAuthority('GET /api/orders/admin/all')")
    @Operation(summary = "Lấy danh sách tất cả đơn hàng trên hệ thống", description = "Yêu cầu quyền: <b>GET /api/orders/admin/all</b>. Hỗ trợ tìm kiếm theo mã đơn hàng.")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        log.info("Request: GET all orders (Admin) - page: {}, size: {}, keyword: {}, status: {}", page, size, keyword,
                status);

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> response;

        if (keyword != null && !keyword.trim().isEmpty()) {
            // Tìm kiếm theo keyword
            if (status != null && !status.trim().isEmpty() && !status.equals("ALL")) {
                // Tìm kiếm + filter theo status
                response = orderService.searchOrdersByStatus(keyword.trim(), status, pageable);
            } else {
                // Tìm kiếm tất cả
                response = orderService.searchOrders(keyword.trim(), pageable);
            }
        } else {
            // Không có keyword - lấy bình thường
            if (status != null && !status.trim().isEmpty() && !status.equals("ALL")) {
                response = orderService.getOrdersByStatusForAdmin(status, pageable);
            } else {
                response = orderService.getAllOrders(pageable);
            }
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thống kê đơn hàng (Admin)
     * GET /api/orders/admin/stats
     */
    @GetMapping("/admin/stats")
    @ApiMessage("Lấy thống kê đơn hàng (Admin)")
    @PreAuthorize("hasAuthority('GET /api/orders/admin/all')")
    @Operation(summary = "Lấy thống kê đơn hàng", description = "Yêu cầu quyền: <b>GET /api/orders/admin/all</b>")
    public ResponseEntity<com.tranan.orderservice.application.dto.response.OrderStatsResponse> getStats() {
        log.info("Request: GET order stats (Admin)");
        return ResponseEntity.ok(orderService.getStats());
    }

    /**
     * Cập nhật trạng thái đơn hàng (Admin)
     * PUT /api/orders/admin/{orderId}/status
     */
    @PutMapping("/admin/{orderId}/status")
    @ApiMessage("Cập nhật trạng thái đơn hàng (Admin)")
    @PreAuthorize("hasAuthority('PUT /api/orders/admin/{orderId}/status')")
    @Operation(summary = "Cập nhật trạng thái đơn hàng", description = "Yêu cầu quyền: <b>PUT /api/orders/admin/{orderId}/status</b>")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        log.info("Request: UPDATE order {} status (Admin) to: {}", orderId, status);

        OrderResponse response = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(response);
    }
}
