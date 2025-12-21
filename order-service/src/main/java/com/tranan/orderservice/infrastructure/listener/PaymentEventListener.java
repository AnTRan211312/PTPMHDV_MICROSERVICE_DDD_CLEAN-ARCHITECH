package com.tranan.orderservice.infrastructure.listener;

import com.tranan.orderservice.infrastructure.event.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentEventListener {

    /**
     * Listen to payment-events topic
     * Process payment events and update order status
     */
    @KafkaListener(topics = "payment-events", groupId = "order-service-group", containerFactory = "kafkaListenerContainerFactory")
    public void handlePaymentEvent(PaymentEvent event) {
        try {
            log.info("Received payment event: eventType={}, orderId={}, status={}",
                    event.getEventType(), event.getOrderId(), event.getStatus());

            if ("PAYMENT_COMPLETED".equals(event.getEventType())) {
                handlePaymentCompleted(event);
            } else if ("PAYMENT_FAILED".equals(event.getEventType())) {
                handlePaymentFailed(event);
            } else {
                log.warn("Unknown payment event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing payment event: {}", event, e);
        }
    }

    private final com.tranan.orderservice.application.usecase.OrderService orderService;

    private void handlePaymentCompleted(PaymentEvent event) {
        log.info("Payment completed for orderId: {}", event.getOrderId());
        orderService.confirmPayment(event.getOrderId());
    }

    private void handlePaymentFailed(PaymentEvent event) {
        log.info("Payment failed for orderId: {}", event.getOrderId());
        // For now, we can keep it as PENDING_PAYMENT or update to a specific
        // PAYMENT_FAILED status
        // Usually, we let user try again, so PENDING_PAYMENT is fine,
        // but we might want to log the failure or notify the user.
        // orderService.updateOrderStatus(event.getOrderId(), "PENDING_PAYMENT");
    }
}
