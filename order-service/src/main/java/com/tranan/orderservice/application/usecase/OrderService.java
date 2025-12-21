package com.tranan.orderservice.application.usecase;

import com.tranan.orderservice.application.dto.response.OrderItemResponse;
import com.tranan.orderservice.application.dto.response.OrderResponse;
import com.tranan.orderservice.domain.model.Order;
import com.tranan.orderservice.domain.model.OrderItem;
import com.tranan.orderservice.domain.model.OrderStatus;
import com.tranan.orderservice.domain.repository.OrderRepository;
import com.tranan.orderservice.infrastructure.client.client.CartServiceClient;
import com.tranan.orderservice.infrastructure.client.client.InventoryServiceClient;
import com.tranan.orderservice.infrastructure.client.client.ProductServiceClient;
import com.tranan.orderservice.infrastructure.client.dto.*;
import com.tranan.orderservice.infrastructure.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartServiceClient cartServiceClient;
    private final ProductServiceClient productServiceClient;
    private final InventoryServiceClient inventoryServiceClient;
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    /**
     * Tạo đơn hàng từ giỏ hàng của user (tất cả items)
     * Flow: Get Cart → Validate Products → Check Inventory → Reduce Stock → Create
     * Order → Clear Cart
     */
    @Transactional
    public OrderResponse createOrder(Long userId) {
        log.info("Starting order creation for userId: {}", userId);

        // 1. Lấy giỏ hàng từ Cart Service
        CartResponse cart = getCart(userId);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng trống. Không thể tạo đơn hàng.");
        }
        log.info("Retrieved cart with {} items for userId: {}", cart.getItems().size(), userId);

        // 2. Lấy danh sách productIds từ giỏ hàng
        List<Long> productIds = cart.getItems().stream()
                .map(CartItemResponse::getProductId)
                .collect(Collectors.toList());

        // 3. Validate giá sản phẩm mới nhất từ Product Service (batch)
        Map<Long, ProductDTO> productMap = validateProducts(productIds);
        log.info("Validated {} products from Product Service", productMap.size());

        // 4. Kiểm tra tồn kho từ Inventory Service (batch)
        Map<Long, Integer> inventoryMap = checkInventory(productIds);
        log.info("Checked inventory for {} products", inventoryMap.size());

        // 5. Validate giá và tồn kho cho từng item trong giỏ
        validateCartItems(cart.getItems(), productMap, inventoryMap);

        // 6. Giảm tồn kho (với pessimistic lock)
        reduceInventory(cart.getItems());
        log.info("Successfully reduced inventory for {} items", cart.getItems().size());

        // 7. Tạo đơn hàng
        Order order = buildOrder(userId, cart, productMap);
        order = orderRepository.save(order);
        log.info("Created order with orderCode: {} for userId: {}", order.getOrderCode(), userId);

        // 8. Clear giỏ hàng
        clearCart(userId);
        log.info("Cleared cart for userId: {}", userId);

        // 9. Publish order created event
        publishOrderCreatedEvent(order);

        return mapToOrderResponse(order);
    }

    /**
     * Tạo đơn hàng từ giỏ hàng với items được chọn
     * Flow: Get Cart → Filter Selected Items → Validate Products → Check Inventory
     * → Reduce Stock → Create Order → Remove Selected Items from Cart
     */
    @Transactional
    public OrderResponse createOrderWithSelectedItems(Long userId, List<Long> selectedProductIds) {
        log.info("Starting order creation with selected items for userId: {}, productIds: {}", userId,
                selectedProductIds);

        if (selectedProductIds == null || selectedProductIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một sản phẩm.");
        }

        // 1. Lấy giỏ hàng từ Cart Service
        CartResponse cart = getCart(userId);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng trống. Không thể tạo đơn hàng.");
        }

        // 2. Filter items được chọn theo selectedProductIds
        List<CartItemResponse> selectedItems = cart.getItems().stream()
                .filter(item -> selectedProductIds.contains(item.getProductId()))
                .collect(Collectors.toList());

        if (selectedItems.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy items được chọn trong giỏ hàng.");
        }

        log.info("Selected {} items from cart for userId: {}", selectedItems.size(), userId);

        // 3. Lấy danh sách productIds từ items được chọn
        List<Long> productIds = selectedItems.stream()
                .map(CartItemResponse::getProductId)
                .collect(Collectors.toList());

        // 4. Validate giá sản phẩm mới nhất từ Product Service (batch)
        Map<Long, ProductDTO> productMap = validateProducts(productIds);
        log.info("Validated {} products from Product Service", productMap.size());

        // 5. Kiểm tra tồn kho từ Inventory Service (batch)
        Map<Long, Integer> inventoryMap = checkInventory(productIds);
        log.info("Checked inventory for {} products", inventoryMap.size());

        // 6. Validate giá và tồn kho cho từng item được chọn
        validateCartItems(selectedItems, productMap, inventoryMap);

        // 7. Giảm tồn kho (với pessimistic lock)
        reduceInventory(selectedItems);
        log.info("Successfully reduced inventory for {} items", selectedItems.size());

        // 8. Tạo đơn hàng
        Order order = buildOrder(userId, selectedItems, productMap);
        order = orderRepository.save(order);
        log.info("Created order with orderCode: {} for userId: {}", order.getOrderCode(), userId);

        // 9. Remove selected items từ giỏ hàng
        removeSelectedItemsFromCart(userId, selectedProductIds);
        log.info("Removed {} selected items from cart for userId: {}", selectedItems.size(), userId);

        // 10. Publish order created event
        publishOrderCreatedEvent(order);

        return mapToOrderResponse(order);
    }

    /**
     * Lấy giỏ hàng từ Cart Service
     */
    private CartResponse getCart(Long userId) {
        try {
            return cartServiceClient.getCartByUserId(userId);
        } catch (Exception e) {
            log.error("Failed to get cart for userId: {}", userId, e);
            throw new IllegalArgumentException("Không thể lấy giỏ hàng. Vui lòng thử lại.");
        }
    }

    /**
     * Validate sản phẩm từ Product Service
     * Kiểm tra giá và availability
     */
    private Map<Long, ProductDTO> validateProducts(List<Long> productIds) {
        try {
            List<ProductDTO> products = productServiceClient.getProductsByIds(productIds);

            if (products.size() != productIds.size()) {
                throw new IllegalArgumentException("Một số sản phẩm trong giỏ hàng không tồn tại.");
            }

            // Kiểm tra availability
            List<ProductDTO> unavailableProducts = products.stream()
                    .filter(p -> p.getAvailable() == null || !p.getAvailable())
                    .collect(Collectors.toList());

            if (!unavailableProducts.isEmpty()) {
                String productNames = unavailableProducts.stream()
                        .map(ProductDTO::getName)
                        .collect(Collectors.joining(", "));
                throw new IllegalArgumentException(
                        String.format("Các sản phẩm sau không khả dụng: %s", productNames));
            }

            return products.stream()
                    .collect(Collectors.toMap(ProductDTO::getId, p -> p));
        } catch (Exception e) {
            log.error("Failed to validate products", e);
            throw new IllegalArgumentException("Không thể xác thực sản phẩm. Vui lòng thử lại.");
        }
    }

    /**
     * Kiểm tra tồn kho từ Inventory Service
     */
    private Map<Long, Integer> checkInventory(List<Long> productIds) {
        try {
            List<InventoryQuantityResponse> inventories = inventoryServiceClient.getQuantitiesByProductIds(productIds);

            return inventories.stream()
                    .collect(Collectors.toMap(
                            InventoryQuantityResponse::getProductId,
                            inv -> inv.getQuantity() != null ? inv.getQuantity() : 0));
        } catch (Exception e) {
            log.error("Failed to check inventory", e);
            throw new IllegalArgumentException("Không thể kiểm tra tồn kho. Vui lòng thử lại.");
        }
    }

    /**
     * Validate từng item trong giỏ: giá và tồn kho
     */
    private void validateCartItems(List<CartItemResponse> cartItems,
            Map<Long, ProductDTO> productMap,
            Map<Long, Integer> inventoryMap) {
        for (CartItemResponse cartItem : cartItems) {
            Long productId = cartItem.getProductId();
            ProductDTO product = productMap.get(productId);
            Integer availableStock = inventoryMap.getOrDefault(productId, 0);

            // Kiểm tra giá có thay đổi không
            BigDecimal currentPrice = product.getDiscountPrice() != null
                    ? product.getDiscountPrice()
                    : product.getPrice();

            if (currentPrice.compareTo(cartItem.getEffectivePrice()) != 0) {
                throw new IllegalArgumentException(
                        String.format("Giá sản phẩm '%s' đã thay đổi. Vui lòng cập nhật giỏ hàng.",
                                product.getName()));
            }

            // Kiểm tra tồn kho
            if (cartItem.getQuantity() > availableStock) {
                throw new IllegalArgumentException(
                        String.format("Sản phẩm '%s' chỉ còn %d trong kho (bạn đang đặt %d).",
                                product.getName(), availableStock, cartItem.getQuantity()));
            }
        }
    }

    /**
     * Giảm tồn kho cho tất cả items (với pessimistic lock)
     */
    private void reduceInventory(List<CartItemResponse> cartItems) {
        try {
            List<ReduceStockRequest> requests = cartItems.stream()
                    .map(item -> ReduceStockRequest.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .build())
                    .collect(Collectors.toList());

            inventoryServiceClient.reduceMultipleStock(requests);
        } catch (Exception e) {
            log.error("Failed to reduce inventory", e);
            throw new IllegalArgumentException("Không thể giảm tồn kho. Đơn hàng đã bị hủy.");
        }
    }

    /**
     * Remove selected items từ giỏ hàng
     */
    private void removeSelectedItemsFromCart(Long userId, List<Long> productIds) {
        try {
            cartServiceClient.removeCartItemsByProductIds(userId, productIds);
        } catch (Exception e) {
            log.error("Failed to remove selected items from cart for userId: {}", userId, e);
            // Don't throw exception - order already created
        }
    }

    /**
     * Build Order domain model từ cart và product data
     */
    private Order buildOrder(Long userId, CartResponse cart, Map<Long, ProductDTO> productMap) {
        String orderCode = generateOrderCode();
        Instant now = Instant.now();

        Order order = Order.builder()
                .userId(userId)
                .orderCode(orderCode)
                .status(OrderStatus.PENDING_PAYMENT)
                .createdAt(now)
                .updatedAt(now)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItemResponse cartItem : cart.getItems()) {
            ProductDTO product = productMap.get(cartItem.getProductId());
            BigDecimal effectivePrice = product.getDiscountPrice() != null
                    ? product.getDiscountPrice()
                    : product.getPrice();
            BigDecimal subtotal = effectivePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .productName(product.getName())
                    .productDescription(product.getDescription())
                    .productImage(product.getThumbnail())
                    .price(product.getPrice())
                    .discountPrice(product.getDiscountPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(subtotal)
                    .build();

            order.addItem(orderItem);
            totalAmount = totalAmount.add(subtotal);
        }

        order.setTotalAmount(totalAmount);
        return order;
    }

    /**
     * Build Order domain model từ selected items và product data
     */
    private Order buildOrder(Long userId, List<CartItemResponse> selectedItems, Map<Long, ProductDTO> productMap) {
        String orderCode = generateOrderCode();
        Instant now = Instant.now();

        Order order = Order.builder()
                .userId(userId)
                .orderCode(orderCode)
                .status(OrderStatus.PENDING_PAYMENT)
                .createdAt(now)
                .updatedAt(now)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItemResponse cartItem : selectedItems) {
            ProductDTO product = productMap.get(cartItem.getProductId());
            BigDecimal effectivePrice = product.getDiscountPrice() != null
                    ? product.getDiscountPrice()
                    : product.getPrice();
            BigDecimal subtotal = effectivePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .productName(product.getName())
                    .productDescription(product.getDescription())
                    .productImage(product.getThumbnail())
                    .price(product.getPrice())
                    .discountPrice(product.getDiscountPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(subtotal)
                    .build();

            order.addItem(orderItem);
            totalAmount = totalAmount.add(subtotal);
        }

        order.setTotalAmount(totalAmount);
        return order;
    }

    /**
     * Generate order code: ORD-YYYYMMDD-0001
     */
    private String generateOrderCode() {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        int orderCount = orderRepository.countOrdersByDate(today);
        String sequence = String.format("%04d", orderCount + 1);

        return String.format("ORD-%s-%s", dateStr, sequence);
    }

    /**
     * Clear giỏ hàng sau khi tạo đơn thành công
     */
    private void clearCart(Long userId) {
        try {
            cartServiceClient.clearCart(userId);
        } catch (Exception e) {
            log.error("Failed to clear cart for userId: {}", userId, e);
            // Don't throw exception - order already created
        }
    }

    /**
     * Hủy đơn hàng
     * Chỉ cho phép hủy đơn hàng có status PENDING_PAYMENT
     * Restore lại inventory khi hủy
     */
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        log.info("Cancelling order {} for userId: {}", orderId, userId);

        // 1. Lấy đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        // 2. Kiểm tra quyền sở hữu
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền hủy đơn hàng này");
        }

        // 3. Kiểm tra trạng thái
        if (!order.canBeCancelled()) {
            throw new IllegalArgumentException(
                    String.format("Không thể hủy đơn hàng có trạng thái: %s. Chỉ có thể hủy đơn hàng chưa thanh toán.",
                            order.getStatus()));
        }

        // 4. Restore inventory
        restoreInventoryForOrder(order);
        log.info("Restored inventory for order {}", orderId);

        // 5. Update order status
        order.cancel();
        order = orderRepository.save(order);

        log.info("Order {} cancelled successfully", orderId);

        // 6. Publish order cancelled event
        publishOrderCancelledEvent(order);

        return mapToOrderResponse(order);
    }

    /**
     * Lấy đơn hàng theo ID
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        // Kiểm tra quyền sở hữu
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem đơn hàng này");
        }

        return mapToOrderResponse(order);
    }

    /**
     * Lấy danh sách tất cả đơn hàng của user (có phân trang)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> getOrderHistory(Long userId,
            org.springframework.data.domain.Pageable pageable) {
        log.info("Getting order history for userId: {}", userId);

        return orderRepository.findByUserId(userId, pageable)
                .map(this::mapToOrderResponse);
    }

    /**
     * Lấy danh sách đơn hàng theo status (có phân trang)
     */
    public org.springframework.data.domain.Page<OrderResponse> getOrdersByStatus(Long userId, String status,
            org.springframework.data.domain.Pageable pageable) {
        log.info("Getting orders for userId: {} with status: {}", userId, status);

        OrderStatus orderStatus = OrderStatus.fromString(status);
        if (orderStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }

        return orderRepository.findByUserIdAndStatus(userId, orderStatus, pageable)
                .map(this::mapToOrderResponse);
    }

    /**
     * Lấy danh sách đơn hàng theo status cho Admin (tất cả users)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> getOrdersByStatusForAdmin(String status,
            org.springframework.data.domain.Pageable pageable) {
        log.info("Admin: Getting orders with status: {}", status);

        OrderStatus orderStatus = OrderStatus.fromString(status);
        if (orderStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }

        return orderRepository.findByStatus(orderStatus, pageable)
                .map(this::mapToOrderResponse);
    }

    /**
     * Lấy tất cả đơn hàng (Admin only)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> getAllOrders(
            org.springframework.data.domain.Pageable pageable) {
        log.info("Admin: Getting all orders");

        return orderRepository.findAll(pageable)
                .map(this::mapToOrderResponse);
    }

    /**
     * Tìm kiếm đơn hàng theo orderCode (Admin only)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> searchOrders(String keyword,
            org.springframework.data.domain.Pageable pageable) {
        log.info("Admin: Searching orders with keyword: {}", keyword);

        return orderRepository.searchByOrderCode(keyword, pageable)
                .map(this::mapToOrderResponse);
    }

    /**
     * Tìm kiếm đơn hàng theo orderCode và status (Admin only)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> searchOrdersByStatus(String keyword, String status,
            org.springframework.data.domain.Pageable pageable) {
        log.info("Admin: Searching orders with keyword: {} and status: {}", keyword, status);

        OrderStatus orderStatus = OrderStatus.fromString(status);
        if (orderStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }

        return orderRepository.searchByOrderCodeAndStatus(keyword, orderStatus, pageable)
                .map(this::mapToOrderResponse);
    }

    /**
     * Restore inventory khi hủy đơn hàng
     */
    private void restoreInventoryForOrder(Order order) {
        try {
            for (OrderItem item : order.getItems()) {
                inventoryServiceClient.restoreStock(item.getProductId(),
                        ReduceStockRequest.builder()
                                .productId(item.getProductId())
                                .quantity(item.getQuantity())
                                .build());
                log.info("Restored {} units for product {}", item.getQuantity(), item.getProductId());
            }
        } catch (Exception e) {
            log.error("Failed to restore inventory for order {}", order.getId(), e);
            throw new IllegalArgumentException("Không thể hoàn trả tồn kho. Vui lòng liên hệ hỗ trợ.");
        }
    }

    /**
     * Publish order created event to Kafka
     */
    private void publishOrderCreatedEvent(Order order) {
        try {
            OrderEvent event = OrderEvent.builder()
                    .eventType("ORDER_CREATED")
                    .orderId(order.getId())
                    .userId(order.getUserId())
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus().name())
                    .timestamp(Instant.now())
                    .build();

            kafkaTemplate.send("order-events", String.valueOf(order.getId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.debug("Order created event published for orderId: {}", order.getId());
                        } else {
                            log.error("Failed to publish order created event for orderId: {}", order.getId(), ex);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing order created event for orderId: {}", order.getId(), e);
        }
    }

    /**
     * Publish order cancelled event to Kafka
     */
    private void publishOrderCancelledEvent(Order order) {
        try {
            OrderEvent event = OrderEvent.builder()
                    .eventType("ORDER_CANCELLED")
                    .orderId(order.getId())
                    .userId(order.getUserId())
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus().name())
                    .timestamp(Instant.now())
                    .build();

            kafkaTemplate.send("order-events", String.valueOf(order.getId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.debug("Order cancelled event published for orderId: {}", order.getId());
                        } else {
                            log.error("Failed to publish order cancelled event for orderId: {}", order.getId(), ex);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing order cancelled event for orderId: {}", order.getId(), e);
        }
    }

    /**
     * Map Order domain model to OrderResponse DTO
     */
    private OrderResponse mapToOrderResponse(Order order) {
        // Enrich order items với description và image từ Product Service
        List<Long> productIds = order.getItems().stream()
                .map(OrderItem::getProductId)
                .collect(Collectors.toList());

        Map<Long, ProductDTO> productMap = new java.util.HashMap<>();
        try {
            List<ProductDTO> products = productServiceClient.getProductsByIds(productIds);
            for (ProductDTO product : products) {
                productMap.put(product.getId(), product);
            }
        } catch (Exception e) {
            log.warn("Failed to enrich order items with product data: {}", e.getMessage());
        }

        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> {
                    ProductDTO product = productMap.get(item.getProductId());
                    return OrderItemResponse.builder()
                            .productId(item.getProductId())
                            .productName(item.getProductName())
                            .productDescription(
                                    product != null ? product.getDescription() : item.getProductDescription())
                            .productImage(product != null ? product.getThumbnail() : item.getProductImage())
                            .price(item.getPrice())
                            .discountPrice(item.getDiscountPrice())
                            .quantity(item.getQuantity())
                            .subtotal(item.getSubtotal())
                            .build();
                })
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getId())
                .userId(order.getUserId())
                .orderCode(order.getOrderCode())
                .items(itemResponses)
                .totalItems(order.getTotalItemCount())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }

    // ═════════════════════════════════════════════════════════════════════
    // INTERNAL API METHODS (Dùng cho các service khác gọi)
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Lấy chi tiết đơn hàng theo orderId (không kiểm tra userId)
     * Dùng cho internal API
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));
        return mapToOrderResponse(order);
    }

    /**
     * Lấy danh sách đơn hàng của user
     * Dùng cho internal API
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        log.info("Internal call: Getting orders for userId: {}", userId);
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật status đơn hàng
     * Dùng cho internal API (từ payment-service, notification-service, etc.)
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
        log.info("Updating order {} status to: {}", orderId, newStatus);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        OrderStatus targetStatus = OrderStatus.fromString(newStatus);
        if (targetStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + newStatus);
        }

        // Validate transition using domain logic
        order.transitionTo(targetStatus);
        order = orderRepository.save(order);

        log.info("Order {} status updated to: {}", orderId, newStatus);

        // Publish order status updated event
        publishOrderStatusUpdatedEvent(order);

        return mapToOrderResponse(order);
    }

    /**
     * Xử lý xác nhận thanh toán
     * Chỉ update status nếu trạng thái hợp lệ (PENDING_PAYMENT)
     * Bỏ qua nếu đã ở trạng thái sau đó (PAID, SHIPPING, DELIVERED, COMPLETED)
     */
    @Transactional
    public void confirmPayment(Long orderId) {
        log.info("Confirming payment for order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        // Chỉ update nếu đang chờ thanh toán
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.markAsPaid();
            order = orderRepository.save(order);

            log.info("Order {} status updated to: PAID", orderId);
            publishOrderStatusUpdatedEvent(order);
        } else {
            // Log warning nhưng không throw exception để tránh retry vô hạn từ Kafka
            log.warn("Order {} payment confirmed but status is {}. Skipping status update.",
                    orderId, order.getStatus());
        }
    }

    /**
     * Kiểm tra xem đơn hàng có tồn tại không
     * Dùng cho internal API
     */
    @Transactional(readOnly = true)
    public boolean orderExists(Long orderId) {
        return orderRepository.existsById(orderId);
    }

    /**
     * Lấy tổng tiền của đơn hàng
     * Dùng cho internal API (từ payment-service)
     */
    @Transactional(readOnly = true)
    public OrderTotalResponse getOrderTotal(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        return OrderTotalResponse.builder()
                .orderId(order.getId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .build();
    }

    /**
     * Publish order status updated event to Kafka
     */
    private void publishOrderStatusUpdatedEvent(Order order) {
        try {
            OrderEvent event = OrderEvent.builder()
                    .eventType("ORDER_STATUS_UPDATED")
                    .orderId(order.getId())
                    .userId(order.getUserId())
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus().name())
                    .timestamp(Instant.now())
                    .build();

            kafkaTemplate.send("order-events", String.valueOf(order.getId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.debug("Order status updated event published for orderId: {}", order.getId());
                        } else {
                            log.error("Failed to publish order status updated event for orderId: {}", order.getId(),
                                    ex);
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing order status updated event for orderId: {}", order.getId(), e);
        }
    }

    /**
     * Lấy thống kê đơn hàng tổng hợp (Admin)
     */
    @Transactional(readOnly = true)
    public com.tranan.orderservice.application.dto.response.OrderStatsResponse getStats() {
        long total = orderRepository.countTotal();
        long pendingPayment = orderRepository.countByStatus(OrderStatus.PENDING_PAYMENT);
        long paid = orderRepository.countByStatus(OrderStatus.PAID);
        long shipping = orderRepository.countByStatus(OrderStatus.SHIPPING);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);

        return com.tranan.orderservice.application.dto.response.OrderStatsResponse.builder()
                .total(total)
                .pendingPayment(pendingPayment)
                .paid(paid)
                .shipping(shipping)
                .delivered(delivered)
                .completed(completed)
                .cancelled(cancelled)
                .build();
    }
}
