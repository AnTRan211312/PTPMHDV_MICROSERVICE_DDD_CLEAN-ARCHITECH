package com.tranan.paymentservice.infrastructure.client.client;

import com.tranan.paymentservice.infrastructure.client.dto.RestoreStockRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "inventory-service", path = "/api/internal/inventories")
public interface InventoryServiceClient {

    @PostMapping("/restore-multiple")
    void restoreMultipleStock(@RequestBody List<RestoreStockRequest> requests);
}
