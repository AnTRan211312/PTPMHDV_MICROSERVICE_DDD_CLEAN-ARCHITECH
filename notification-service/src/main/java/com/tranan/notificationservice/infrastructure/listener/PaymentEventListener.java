package com.tranan.notificationservice.infrastructure.listener;

import com.tranan.notificationservice.infrastructure.event.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentEventListener {

    private final com.tranan.notificationservice.application.service.NotificationService notificationService;

    /**
     * Listen to payment-events topic
     * Process payment events and send notifications
     */
    @KafkaListener(topics = "payment-events", groupId = "notification-service-group", containerFactory = "paymentEventKafkaListenerContainerFactory")
    public void handlePaymentEvent(PaymentEvent event) {
        try {
            log.info(
                    "[PaymentEventListener] Received payment event: eventType={}, paymentId={}, orderId={}, status={}, userId={}",
                    event.getEventType(), event.getPaymentId(), event.getOrderId(), event.getStatus(),
                    event.getUserId());

            if (event.getEventType() == null) {
                log.warn("[PaymentEventListener] Received event with null eventType");
                return;
            }

            switch (event.getEventType()) {
                case "PAYMENT_COMPLETED":
                    handlePaymentCompleted(event);
                    break;
                case "PAYMENT_FAILED":
                    handlePaymentFailed(event);
                    break;
                default:
                    log.warn("[PaymentEventListener] Unknown payment event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("[PaymentEventListener] Error processing payment event: {}", event, e);
        }
    }

    /**
     * Handle PAYMENT_COMPLETED event
     * Send notification to user about successful payment
     */
    private void handlePaymentCompleted(PaymentEvent event) {
        log.info("[PaymentEventListener] Processing PAYMENT_COMPLETED event for orderId: {}, paymentId: {}",
                event.getOrderId(), event.getPaymentId());

        String message = String.format(
                "Thanh toán thành công! Đơn hàng #%d đã được thanh toán %s VND. Đơn hàng của bạn đang được xử lý.",
                event.getOrderId(),
                event.getAmount());

        log.info("[PaymentEventListener] Notification for userId {}: {}", event.getUserId(), message);

        notificationService.createNotification(
                event.getUserId(),
                "Thanh toán thành công",
                message,
                "PAYMENT",
                String.valueOf(event.getOrderId()));
    }

    /**
     * Handle PAYMENT_FAILED event
     * Send notification to user about failed payment
     */
    private void handlePaymentFailed(PaymentEvent event) {
        log.info("[PaymentEventListener] Processing PAYMENT_FAILED event for orderId: {}, paymentId: {}",
                event.getOrderId(), event.getPaymentId());

        String message = String.format(
                "Thanh toán thất bại cho đơn hàng #%d. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
                event.getOrderId());

        log.info("[PaymentEventListener] Notification for userId {}: {}", event.getUserId(), message);

        notificationService.createNotification(
                event.getUserId(),
                "Thanh toán thất bại",
                message,
                "PAYMENT",
                String.valueOf(event.getOrderId()));
    }
}
