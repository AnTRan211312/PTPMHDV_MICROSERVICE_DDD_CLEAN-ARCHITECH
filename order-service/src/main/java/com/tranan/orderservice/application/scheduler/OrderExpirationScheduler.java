package com.tranan.orderservice.application.scheduler;

import com.tranan.orderservice.domain.model.Order;
import com.tranan.orderservice.domain.model.OrderItem;
import com.tranan.orderservice.domain.model.OrderStatus;
import com.tranan.orderservice.domain.repository.OrderRepository;
import com.tranan.orderservice.infrastructure.client.client.InventoryServiceClient;
import com.tranan.orderservice.infrastructure.client.dto.ReduceStockRequest;
import com.tranan.orderservice.infrastructure.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduler để tự động hủy các đơn hàng PENDING_PAYMENT quá thời hạn thanh
 * toán.
 * 
 * Workflow:
 * 1. Tìm tất cả đơn hàng PENDING_PAYMENT có createdAt > timeout hours
 * 2. Với mỗi đơn hàng quá hạn:
 * - Restore inventory (hoàn lại số lượng tồn kho)
 * - Cập nhật status sang CANCELLED
 * - Gửi event thông báo cho user
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;
    private final InventoryServiceClient inventoryServiceClient;
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    @Value("${order.payment.timeout-hours:24}")
    private int timeoutHours;

    /**
     * Job chạy định kỳ để kiểm tra và hủy đơn hàng quá hạn.
     * Mặc định chạy mỗi 30 phút.
     */
    @Scheduled(cron = "${order.expiration.cron:0 */30 * * * *}")
    @Transactional
    public void cancelExpiredOrders() {
        log.info("=== Starting Order Expiration Check ===");

        // Tính thời điểm cutoff (đơn hàng tạo trước thời điểm này sẽ bị hủy)
        Instant cutoffTime = Instant.now().minus(timeoutHours, ChronoUnit.HOURS);
        log.info("Looking for PENDING_PAYMENT orders created before: {} (timeout: {} hours)",
                cutoffTime, timeoutHours);

        // Tìm các đơn hàng quá hạn
        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore(
                OrderStatus.PENDING_PAYMENT, cutoffTime);

        if (expiredOrders.isEmpty()) {
            log.info("No expired orders found. Job completed.");
            return;
        }

        log.info("Found {} expired orders. Processing cancellation...", expiredOrders.size());

        int successCount = 0;
        int failCount = 0;

        for (Order order : expiredOrders) {
            try {
                cancelExpiredOrder(order);
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.error("Failed to cancel expired order {}: {}", order.getId(), e.getMessage(), e);
            }
        }

        log.info("=== Order Expiration Check Completed ===");
        log.info("Successfully cancelled: {}, Failed: {}", successCount, failCount);
    }

    /**
     * Hủy một đơn hàng quá hạn.
     */
    private void cancelExpiredOrder(Order order) {
        log.info("Cancelling expired order: {} (orderId: {}, userId: {}, createdAt: {})",
                order.getOrderCode(), order.getId(), order.getUserId(), order.getCreatedAt());

        // 1. Restore inventory
        restoreInventoryForOrder(order);

        // 2. Cập nhật status
        order.cancel(); // Sử dụng domain method để transition
        orderRepository.save(order);

        // 3. Publish event
        publishOrderExpiredEvent(order);

        log.info("Order {} cancelled successfully due to payment timeout", order.getOrderCode());
    }

    /**
     * Hoàn lại inventory cho các items trong đơn hàng.
     */
    private void restoreInventoryForOrder(Order order) {
        for (OrderItem item : order.getItems()) {
            try {
                log.info("Restoring inventory for product {} (quantity: {})",
                        item.getProductId(), item.getQuantity());
                inventoryServiceClient.restoreStock(
                        item.getProductId(),
                        ReduceStockRequest.builder()
                                .productId(item.getProductId())
                                .quantity(item.getQuantity())
                                .build());
            } catch (Exception e) {
                log.error("Failed to restore inventory for product {}: {}",
                        item.getProductId(), e.getMessage());
                // Tiếp tục xử lý các item khác, log lỗi để xử lý manual nếu cần
            }
        }
    }

    /**
     * Publish event thông báo đơn hàng đã bị hủy do quá hạn thanh toán.
     */
    private void publishOrderExpiredEvent(Order order) {
        try {
            OrderEvent event = OrderEvent.builder()
                    .eventType("ORDER_EXPIRED")
                    .orderId(order.getId())
                    .userId(order.getUserId())
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus().name())
                    .timestamp(Instant.now())
                    .build();

            kafkaTemplate.send("order-events", String.valueOf(order.getId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.debug("Order expired event published for orderId: {}", order.getId());
                        } else {
                            log.error("Failed to publish order expired event for orderId: {}", order.getId(), ex);
                        }
                    });

            log.info("Published OrderExpiredEvent for expired order {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to publish OrderExpiredEvent for order {}: {}",
                    order.getId(), e.getMessage());
        }
    }
}
