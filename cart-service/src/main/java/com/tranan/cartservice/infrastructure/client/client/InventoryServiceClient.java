package com.tranan.cartservice.infrastructure.client.client;

import com.tranan.cartservice.infrastructure.client.dto.InventoryQuantityResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "inventory-service")
public interface InventoryServiceClient {

    @GetMapping("/api/internal/inventories/quantity/{productId}")
    InventoryQuantityResponse getQuantity(@PathVariable("productId") Long productId);

    @GetMapping("/api/internal/inventories/quantity/batch")
    List<InventoryQuantityResponse> getQuantities(@RequestParam("productIds") List<Long> productIds);
}
