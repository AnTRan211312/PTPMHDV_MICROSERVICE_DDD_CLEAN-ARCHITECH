package com.tranan.orderservice.infrastructure.client.client;

import com.tranan.orderservice.infrastructure.client.dto.InventoryQuantityResponse;
import com.tranan.orderservice.infrastructure.client.dto.ReduceStockRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "inventory-service")
public interface InventoryServiceClient {

    @GetMapping("/api/internal/inventories/quantity/batch")
    List<InventoryQuantityResponse> getQuantitiesByProductIds(@RequestParam("productIds") List<Long> productIds);

    @PostMapping("/api/internal/inventories/reduce-multiple")
    void reduceMultipleStock(@RequestBody List<ReduceStockRequest> requests);

    @PostMapping("/api/internal/inventories/{productId}/restore")
    void restoreStock(@PathVariable("productId") Long productId, @RequestBody ReduceStockRequest request);
}
