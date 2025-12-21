package com.tranan.cartservice.infrastructure.client.client;

import com.tranan.cartservice.infrastructure.client.dto.InventoryQuantityResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class InventoryServiceFallbackFactory implements FallbackFactory<InventoryServiceClient> {

    @Override
    public InventoryServiceClient create(Throwable cause) {
        log.error("Inventory Service call failed. Entering fallback mode. Cause: {}", cause.getMessage(), cause);

        return new InventoryServiceClient() {

            @Override
            public InventoryQuantityResponse getQuantity(Long productId) {
                log.warn("Fallback: Returning quantity 0 for productId {} because Inventory Service is unavailable", productId);
                return new InventoryQuantityResponse(productId, 0); // Giả lập hết hàng
            }

            @Override
            public List<InventoryQuantityResponse> getQuantities(List<Long> productIds) {
                log.warn("Fallback: Returning quantity 0 for {} productIds because Inventory Service is unavailable",
                        productIds != null ? productIds.size() : 0);

                if (productIds == null || productIds.isEmpty()) {
                    return Collections.emptyList();
                }

                return productIds.stream()
                        .map(id -> new InventoryQuantityResponse(id, 0))
                        .toList();
            }
        };
    }
}