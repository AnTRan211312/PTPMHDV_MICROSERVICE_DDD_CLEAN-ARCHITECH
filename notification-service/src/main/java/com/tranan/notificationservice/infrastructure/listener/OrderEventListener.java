package com.tranan.notificationservice.infrastructure.listener;

import com.tranan.notificationservice.infrastructure.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEventListener {

    private final com.tranan.notificationservice.application.service.NotificationService notificationService;

    private static final NumberFormat VND_FORMAT = NumberFormat.getInstance(new Locale("vi", "VN"));

    /**
     * Listen to order-events topic
     * Process order events and send notifications
     */
    @KafkaListener(topics = "order-events", groupId = "notification-service-group", containerFactory = "orderEventKafkaListenerContainerFactory")
    public void handleOrderEvent(OrderEvent event) {
        try {
            log.info("Received order event: eventType={}, orderId={}, userId={}, status={}",
                    event.getEventType(), event.getOrderId(), event.getUserId(), event.getStatus());

            switch (event.getEventType()) {
                case "ORDER_CREATED":
                    handleOrderCreated(event);
                    break;
                case "ORDER_CANCELLED":
                    handleOrderCancelled(event);
                    break;
                case "ORDER_EXPIRED":
                    handleOrderExpired(event);
                    break;
                case "ORDER_STATUS_UPDATED":
                    handleOrderStatusUpdated(event);
                    break;
                default:
                    log.warn("Unknown order event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing order event: {}", event, e);
        }
    }

    /**
     * Handle ORDER_CREATED event
     * Send notification to user about new order (không thông báo admin)
     */
    private void handleOrderCreated(OrderEvent event) {
        log.info("Processing ORDER_CREATED event for orderId: {}", event.getOrderId());

        String formattedAmount = VND_FORMAT.format(event.getTotalAmount()) + " ₫";

        // Notification cho User
        String userMessage = String.format(
                "Đơn hàng #%d đã được tạo thành công! Tổng tiền: %s. Vui lòng thanh toán để hoàn tất đơn hàng.",
                event.getOrderId(),
                formattedAmount);

        notificationService.createNotification(
                event.getUserId(),
                "Đơn hàng mới",
                userMessage,
                "ORDER",
                String.valueOf(event.getOrderId()));

        log.info("Created notification for ORDER_CREATED (user: {})", event.getUserId());
    }

    /**
     * Handle ORDER_CANCELLED event
     * Send notification to user AND admin about cancelled order
     */
    private void handleOrderCancelled(OrderEvent event) {
        log.info("Processing ORDER_CANCELLED event for orderId: {}", event.getOrderId());

        String formattedAmount = VND_FORMAT.format(event.getTotalAmount()) + " ₫";

        // 1. Notification cho User
        String userMessage = String.format(
                "Đơn hàng #%d đã được hủy. Số tiền %s sẽ được hoàn lại (nếu đã thanh toán).",
                event.getOrderId(),
                formattedAmount);

        notificationService.createNotification(
                event.getUserId(),
                "Đơn hàng đã hủy",
                userMessage,
                "ORDER",
                String.valueOf(event.getOrderId()));

        // 2. Notification cho Admin (đơn hàng bị hủy + đã hoàn tồn kho)
        String adminMessage = String.format(
                "❌ Đơn hàng #%d (User #%d) đã bị hủy. Tồn kho đã được hoàn lại. Tổng tiền: %s.",
                event.getOrderId(),
                event.getUserId(),
                formattedAmount);

        notificationService.createAdminNotification(
                "❌ Đơn hàng đã hủy",
                adminMessage,
                "ORDER",
                String.valueOf(event.getOrderId()));

        log.info("Created notifications for ORDER_CANCELLED (user: {}, admin: true)", event.getUserId());
    }

    /**
     * Handle ORDER_EXPIRED event (auto-cancelled due to payment timeout)
     * Send notification to user only (không thông báo admin)
     */
    private void handleOrderExpired(OrderEvent event) {
        log.info("Processing ORDER_EXPIRED event for orderId: {}", event.getOrderId());

        String formattedAmount = VND_FORMAT.format(event.getTotalAmount()) + " ₫";

        // Notification cho User
        String userMessage = String.format(
                "⏰ Đơn hàng #%d đã bị hủy tự động do quá thời hạn thanh toán. Tổng tiền: %s.",
                event.getOrderId(),
                formattedAmount);

        notificationService.createNotification(
                event.getUserId(),
                "Đơn hàng hết hạn",
                userMessage,
                "ORDER",
                String.valueOf(event.getOrderId()));

        log.info("Created notification for ORDER_EXPIRED (user: {})", event.getUserId());
    }

    /**
     * Handle ORDER_STATUS_UPDATED event
     * Send notification to user about order status change
     * Also notify admin for important status changes (PAID)
     */
    private void handleOrderStatusUpdated(OrderEvent event) {
        log.info("Processing ORDER_STATUS_UPDATED event for orderId: {}, new status: {}",
                event.getOrderId(), event.getStatus());

        String title;
        String message;
        boolean notifyAdmin = false;
        String adminTitle = null;
        String adminMessage = null;

        String formattedAmount = VND_FORMAT.format(event.getTotalAmount()) + " ₫";

        switch (event.getStatus()) {
            case "PAID":
                title = "Đơn hàng đã thanh toán";
                message = String.format("Đơn hàng #%d đã được xác nhận thanh toán thành công!", event.getOrderId());

                // Notify admin about successful payment
                notifyAdmin = true;
                adminTitle = "💰 Thanh toán thành công";
                adminMessage = String.format(
                        "💰 Đơn hàng #%d đã thanh toán %s. Vui lòng chuẩn bị hàng và giao cho vận chuyển.",
                        event.getOrderId(), formattedAmount);
                break;
            case "SHIPPING":
                title = "Đơn hàng đang giao";
                message = String.format("Đơn hàng #%d đang được giao đến bạn. Vui lòng chú ý điện thoại!",
                        event.getOrderId());
                break;
            case "DELIVERED":
                title = "Đơn hàng đã giao";
                message = String.format("Đơn hàng #%d đã được giao thành công. Cảm ơn bạn đã mua hàng!",
                        event.getOrderId());
                break;
            case "COMPLETED":
                title = "Đơn hàng hoàn thành";
                message = String.format("Đơn hàng #%d đã hoàn thành. Cảm ơn bạn đã tin tưởng sử dụng dịch vụ!",
                        event.getOrderId());
                break;
            default:
                title = "Cập nhật đơn hàng";
                message = String.format("Đơn hàng #%d đã được cập nhật trạng thái: %s", event.getOrderId(),
                        event.getStatus());
        }

        // User notification
        notificationService.createNotification(
                event.getUserId(),
                title,
                message,
                "ORDER",
                String.valueOf(event.getOrderId()));

        // Admin notification (if applicable)
        if (notifyAdmin && adminTitle != null) {
            notificationService.createAdminNotification(
                    adminTitle,
                    adminMessage,
                    "ORDER",
                    String.valueOf(event.getOrderId()));
            log.info("Created admin notification for status: {}", event.getStatus());
        }

        log.info("Notification for userId {}: {}", event.getUserId(), message);
    }
}
