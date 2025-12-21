package com.tranan.notificationservice.infrastructure.listener;

import com.tranan.notificationservice.infrastructure.event.CartAnalyticsEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartEventListener {

    private final com.tranan.notificationservice.application.service.NotificationService notificationService;

    /**
     * Listen to cart-analytics-events topic
     * Process cart events and send notifications
     */
    @KafkaListener(topics = "cart-analytics-events", groupId = "notification-service-group", containerFactory = "cartAnalyticsEventKafkaListenerContainerFactory")
    public void handleCartAnalyticsEvent(CartAnalyticsEvent event) {
        try {
            log.info("Received cart event: eventType={}, userId={}, productId={}, productName={}, quantity={}",
                    event.getEventType(), event.getUserId(), event.getProductId(),
                    event.getProductName(), event.getQuantity());

            if ("ADD_TO_CART".equals(event.getEventType())) {
                handleAddToCartEvent(event);
            } else {
                log.warn("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing cart event: {}", event, e);
            // Don't throw exception - let Kafka handle retry
        }
    }

    /**
     * Handle ADD_TO_CART event
     * Send notification to user
     */
    private void handleAddToCartEvent(CartAnalyticsEvent event) {
        log.info("Processing ADD_TO_CART event for userId: {}", event.getUserId());

        String message = String.format(
                "Bạn đã thêm %d x %s vào giỏ hàng. Giá: %s",
                event.getQuantity(),
                event.getProductName(),
                event.getEffectivePrice());

        log.info("Notification message for userId {}: {}", event.getUserId(), message);

        notificationService.createNotification(
                event.getUserId(),
                "Thêm vào giỏ hàng",
                message,
                "CART",
                String.valueOf(event.getProductId()));
    }
}
