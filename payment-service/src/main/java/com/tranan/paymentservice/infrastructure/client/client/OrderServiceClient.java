package com.tranan.paymentservice.infrastructure.client.client;

import com.tranan.paymentservice.infrastructure.client.dto.OrderResponse;
import com.tranan.paymentservice.infrastructure.client.dto.UpdateOrderStatusRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "order-service", path = "/api/orders/internal")
public interface OrderServiceClient {

    @GetMapping("/{orderId}")
    OrderResponse getOrderById(@PathVariable Long orderId);

    @PutMapping("/{orderId}/status")
    OrderResponse updateOrderStatus(@PathVariable("orderId") Long orderId,
            @RequestBody UpdateOrderStatusRequest request);
}
