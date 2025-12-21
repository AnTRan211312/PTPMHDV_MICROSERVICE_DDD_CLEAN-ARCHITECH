package com.tranan.inventoryservice.infrastructure.client.internal;

import com.tranan.inventoryservice.annotation.ApiMessage;
import com.tranan.inventoryservice.application.dto.request.ReduceStockRequest;
import com.tranan.inventoryservice.application.usecase.InventoryService;
import com.tranan.inventoryservice.infrastructure.client.dto.InventoryQuantityResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Internal Inventory API - Dùng cho các service khác gọi
 * Không yêu cầu authentication
 */
@RestController
@RequestMapping("/api/internal/inventories")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "Internal Inventory API", description = "API nội bộ dùng để các service khác lấy thông tin tồn kho")
public class InternalInventoryController {

    private final InventoryService inventoryService;

    /**
     * Lấy số lượng tồn kho của một sản phẩm theo productId
     * GET /api/internal/inventories/quantity/{productId}
     */
    @GetMapping("/quantity/{productId}")
    @ApiMessage(value = "Lấy số lượng tồn kho của sản phẩm")
    public ResponseEntity<InventoryQuantityResponse> getQuantityByProductId(@PathVariable Long productId) {
        log.info("Internal call: Getting inventory quantity for productId {}", productId);
        Integer quantity = inventoryService.getQuantityByProductId(productId);
        return ResponseEntity.ok(new InventoryQuantityResponse(productId, quantity));
    }

    /**
     * Lấy số lượng tồn kho của nhiều sản phẩm cùng lúc (batch)
     * GET /api/internal/inventories/quantity/batch?productIds=1,2,3
     */
    @GetMapping("/quantity/batch")
    @ApiMessage(value = "Lấy số lượng tồn kho của nhiều sản phẩm")
    public ResponseEntity<List<InventoryQuantityResponse>> getQuantitiesByProductIds(@RequestParam List<Long> productIds) {
        log.info("Internal call: Getting inventory quantities for {} productIds", productIds.size());
        List<InventoryQuantityResponse> response = inventoryService.getQuantitiesByProductIds(productIds);
        return ResponseEntity.ok(response);
    }

    /**
     * Giảm tồn kho cho một sản phẩm
     * POST /api/internal/inventories/{productId}/reduce
     * Body: { "quantity": 5 }
     */
    @PostMapping("/{productId}/reduce")
    @ApiMessage(value = "Giảm tồn kho sản phẩm")
    public ResponseEntity<Void> reduceStock(
            @PathVariable Long productId,
            @RequestBody ReduceStockRequest request) {
        log.info("Internal call: Reducing stock for productId {} by {} units", productId, request.getQuantity());
        inventoryService.reduceStock(productId, request.getQuantity());
        return ResponseEntity.noContent().build();
    }

    /**
     * Giảm tồn kho cho nhiều sản phẩm cùng lúc
     * POST /api/internal/inventories/reduce-multiple
     * Body: [{ "productId": 1, "quantity": 5 }, { "productId": 2, "quantity": 3 }]
     */
    @PostMapping("/reduce-multiple")
    @ApiMessage(value = "Giảm tồn kho cho nhiều sản phẩm")
    public ResponseEntity<Void> reduceMultipleStock(@RequestBody List<ReduceStockRequest> requests) {
        log.info("Internal call: Reducing stock for {} products", requests.size());
        Map<Long, Integer> productQuantities = new java.util.HashMap<>();
        for (ReduceStockRequest request : requests) {
            productQuantities.put(request.getProductId(), request.getQuantity());
        }
        inventoryService.reduceMultipleStock(productQuantities);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restore tồn kho cho một sản phẩm (dùng khi thanh toán thất bại)
     * POST /api/internal/inventories/{productId}/restore
     * Body: { "quantity": 5 }
     */
    @PostMapping("/{productId}/restore")
    @ApiMessage(value = "Restore tồn kho sản phẩm")
    public ResponseEntity<Void> restoreStock(
            @PathVariable Long productId,
            @RequestBody RestoreStockRequest request) {
        log.info("Internal call: Restoring stock for productId {} by {} units", productId, request.getQuantity());
        inventoryService.restoreStock(productId, request.getQuantity());
        return ResponseEntity.noContent().build();
    }

    /**
     * Restore tồn kho cho nhiều sản phẩm (dùng khi thanh toán thất bại)
     * POST /api/internal/inventories/restore-multiple
     * Body: [{ "productId": 1, "quantity": 5 }, { "productId": 2, "quantity": 3 }]
     * FIX N+1: Batch restore thay vì loop
     */
    @PostMapping("/restore-multiple")
    @ApiMessage(value = "Restore tồn kho cho nhiều sản phẩm")
    public ResponseEntity<Void> restoreMultipleStock(@RequestBody List<RestoreStockRequest> requests) {
        log.info("Internal call: Restoring stock for {} products", requests.size());
        
        // FIX N+1: Convert to Map và gọi batch method
        Map<Long, Integer> productQuantities = new java.util.HashMap<>();
        for (RestoreStockRequest request : requests) {
            productQuantities.put(request.getProductId(), request.getQuantity());
        }
        inventoryService.restoreMultipleStock(productQuantities);
        
        log.info("Internal call: Successfully restored stock for {} products", requests.size());
        return ResponseEntity.noContent().build();
    }

    /**
     * Kiểm tra xem sản phẩm có đủ tồn kho không
     * GET /api/internal/inventories/{productId}/check?quantity=5
     */
    @GetMapping("/{productId}/check")
    @ApiMessage(value = "Kiểm tra tồn kho sản phẩm")
    public ResponseEntity<StockCheckResponse> checkStock(
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        log.info("Internal call: Checking stock for productId {} with quantity {}", productId, quantity);
        Integer availableStock = inventoryService.getQuantityByProductId(productId);
        boolean hasStock = availableStock != null && availableStock >= quantity;
        
        StockCheckResponse response = StockCheckResponse.builder()
                .productId(productId)
                .requestedQuantity(quantity)
                .availableQuantity(availableStock != null ? availableStock : 0)
                .hasStock(hasStock)
                .build();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Kiểm tra tồn kho cho nhiều sản phẩm cùng lúc
     * POST /api/internal/inventories/check-multiple
     * Body: [{ "productId": 1, "quantity": 5 }, { "productId": 2, "quantity": 3 }]
     * FIX N+1: Batch fetch thay vì loop
     */
    @PostMapping("/check-multiple")
    @ApiMessage(value = "Kiểm tra tồn kho cho nhiều sản phẩm")
    public ResponseEntity<List<StockCheckResponse>> checkMultipleStock(@RequestBody List<CheckStockRequest> requests) {
        log.info("Internal call: Checking stock for {} products", requests.size());
        
        // FIX N+1: Batch fetch tất cả quantities 1 lần
        List<Long> productIds = requests.stream()
                .map(CheckStockRequest::getProductId)
                .toList();
        
        List<InventoryQuantityResponse> quantities = inventoryService.getQuantitiesByProductIds(productIds);
        Map<Long, Integer> quantityMap = quantities.stream()
                .collect(java.util.stream.Collectors.toMap(
                        InventoryQuantityResponse::getProductId,
                        InventoryQuantityResponse::getQuantity
                ));
        
        // Map responses
        List<StockCheckResponse> responses = requests.stream()
                .map(request -> {
                    Integer availableStock = quantityMap.getOrDefault(request.getProductId(), 0);
                    boolean hasStock = availableStock >= request.getQuantity();
                    
                    return StockCheckResponse.builder()
                            .productId(request.getProductId())
                            .requestedQuantity(request.getQuantity())
                            .availableQuantity(availableStock)
                            .hasStock(hasStock)
                            .build();
                })
                .toList();
        
        return ResponseEntity.ok(responses);
    }
}