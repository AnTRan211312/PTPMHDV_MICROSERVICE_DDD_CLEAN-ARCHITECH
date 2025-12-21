package com.tranan.inventoryservice.presentation.controller;

import com.tranan.inventoryservice.annotation.ApiMessage;
import com.tranan.inventoryservice.application.dto.request.CreateInventoryRequest;
import com.tranan.inventoryservice.application.dto.request.UpdateInventoryRequest;
import com.tranan.inventoryservice.application.dto.response.InventoryResponse;
import com.tranan.inventoryservice.application.dto.response.PageResponseDto;
import com.tranan.inventoryservice.application.usecase.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Inventory Controller
 * Quản lý kho hàng (Admin) & Xem tồn kho (Public)
 */
@Slf4j
@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

        private final InventoryService inventoryService;

        // ========================================================================
        // 1. TẠO KHO (ADMIN)
        // URL: POST /api/inventory/101
        // ========================================================================
        @PostMapping("/{productId}")
        @ApiMessage("Tạo kho hàng cho sản phẩm")
        @PreAuthorize("hasAuthority('POST /api/inventory/{productId}')")
        @Operation(summary = "Tạo kho hàng", description = "Yêu cầu quyền: <b>POST /api/inventory/{productId}</b>")
        public ResponseEntity<InventoryResponse> createInventory(
                        @PathVariable Long productId,
                        @Valid @RequestBody CreateInventoryRequest request) {

                log.info("Creating inventory for product {}", productId);
                // Truyền productId lấy từ URL vào service
                InventoryResponse response = inventoryService.createInventory(productId, request);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        // ========================================================================
        // 2. LẤY DANH SÁCH (ADMIN)
        // URL: GET /api/inventory
        // ========================================================================
        @GetMapping
        @PreAuthorize("hasAuthority('GET /api/inventory')")
        @ApiMessage("Lấy danh sách kho hàng")
        @Operation(summary = "Lấy danh sách kho hàng", description = "Yêu cầu quyền: <b>GET /api/inventory</b>. Hỗ trợ tìm kiếm theo Product ID, tên sản phẩm, hoặc trạng thái tồn kho (OUT_OF_STOCK, LOW_STOCK, IN_STOCK).")
        public ResponseEntity<PageResponseDto<InventoryResponse>> getAllInventories(
                        @RequestParam(required = false) Long productId,
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) String stockStatus,
                        @PageableDefault(size = 10) Pageable pageable) {
                Page<InventoryResponse> page = inventoryService.getAllInventories(productId, keyword, stockStatus,
                                pageable);
                PageResponseDto<InventoryResponse> response = new PageResponseDto<>(
                                page.getContent(),
                                page.getNumber() + 1,
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages());

                return ResponseEntity.ok(response);
        }

        // ========================================================================
        // 2.1. LẤY THỐNG KÊ TỒN KHO (ADMIN)
        // URL: GET /api/inventory/stats
        // ========================================================================
        @GetMapping("/stats")
        @PreAuthorize("hasAuthority('GET /api/inventory')")
        @ApiMessage("Lấy thống kê tồn kho")
        @Operation(summary = "Lấy thống kê tồn kho", description = "Yêu cầu quyền: <b>GET /api/inventory</b>")
        public ResponseEntity<com.tranan.inventoryservice.application.dto.response.InventoryStatsResponse> getStats() {
                return ResponseEntity.ok(inventoryService.getStats());
        }

        // ========================================================================
        // 3. XEM CHI TIẾT (PUBLIC - KHÁCH HÀNG)
        // URL: GET /api/inventory/101
        // ========================================================================
        @GetMapping("/{productId}")
        @ApiMessage("Lấy kho hàng của sản phẩm")
        @Operation(summary = "Lấy kho hàng theo ID", description = "Public API (Không yêu cầu quyền)")
        public ResponseEntity<InventoryResponse> getInventory(@PathVariable Long productId) {
                log.info("Getting inventory for product {}", productId);
                InventoryResponse response = inventoryService.getInventory(productId);
                return ResponseEntity.ok(response);
        }

        // ========================================================================
        // 4. CẬP NHẬT KHO (ADMIN)
        // URL: PUT /api/inventory/101
        // ========================================================================
        @PutMapping("/{productId}")
        @PreAuthorize("hasAuthority('PUT /api/inventory/{productId}')")
        @ApiMessage("Sửa kho hàng")
        @Operation(summary = "Sửa kho hàng", description = "Yêu cầu quyền: <b>PUT /api/inventory/{productId}</b>")
        public ResponseEntity<InventoryResponse> updateInventory(
                        @PathVariable Long productId,
                        @Valid @RequestBody UpdateInventoryRequest request) {

                log.info("Updating inventory for product {}", productId);
                InventoryResponse response = inventoryService.updateInventory(productId, request);
                return ResponseEntity.ok(response);
        }

        // ========================================================================
        // 5. XÓA KHO (ADMIN)
        // URL: DELETE /api/inventory/101
        // ========================================================================
        @DeleteMapping("/{productId}")
        @PreAuthorize("hasAuthority('DELETE /api/inventory/{productId}')")
        @ApiMessage("Xóa kho hàng")
        @Operation(summary = "Xóa kho hàng", description = "Yêu cầu quyền: <b>DELETE /api/inventory/{productId}</b>")
        public ResponseEntity<Void> deleteInventory(@PathVariable Long productId) {
                log.info("Deleting inventory for product {}", productId);
                inventoryService.deleteInventory(productId);
                return ResponseEntity.noContent().build();
        }

        // ========================================================================
        // 6. BATCH GET QUANTITIES (INTERNAL API)
        // URL: GET /api/inventory/batch?productIds=1,2,3
        // ========================================================================
        @GetMapping("/batch")
        @Operation(summary = "Lấy số lượng tồn kho cho nhiều sản phẩm (Internal API)", description = "Public API - Không yêu cầu quyền")
        public ResponseEntity<List<com.tranan.inventoryservice.infrastructure.client.dto.InventoryQuantityResponse>> getQuantitiesByProductIds(
                        @RequestParam List<Long> productIds) {
                log.info("Getting quantities for {} products", productIds.size());
                List<com.tranan.inventoryservice.infrastructure.client.dto.InventoryQuantityResponse> response = inventoryService
                                .getQuantitiesByProductIds(productIds);
                return ResponseEntity.ok(response);
        }

        // ========================================================================
        // 7. REDUCE MULTIPLE STOCK (INTERNAL API)
        // URL: POST /api/inventory/reduce-multiple
        // ========================================================================
        @PostMapping("/reduce-multiple")
        @Operation(summary = "Giảm tồn kho cho nhiều sản phẩm (Internal API)", description = "Public API - Không yêu cầu quyền")
        public ResponseEntity<Void> reduceMultipleStock(
                        @Valid @RequestBody List<com.tranan.inventoryservice.application.dto.request.ReduceStockRequest> requests) {
                log.info("Reducing stock for {} products", requests.size());

                Map<Long, Integer> productQuantities = requests.stream()
                                .collect(Collectors.toMap(
                                                com.tranan.inventoryservice.application.dto.request.ReduceStockRequest::getProductId,
                                                com.tranan.inventoryservice.application.dto.request.ReduceStockRequest::getQuantity));

                inventoryService.reduceMultipleStock(productQuantities);
                return ResponseEntity.noContent().build();
        }

        // ========================================================================
        // 8. RESTORE STOCK (INTERNAL API)
        // URL: POST /api/inventory/{productId}/restore?quantity=5
        // ========================================================================
        @PostMapping("/{productId}/restore")
        @Operation(summary = "Hoàn trả tồn kho (Internal API)", description = "Public API - Không yêu cầu quyền")
        public ResponseEntity<Void> restoreStock(
                        @PathVariable Long productId,
                        @RequestParam Integer quantity) {
                log.info("Restoring {} units for product {}", quantity, productId);
                inventoryService.restoreStock(productId, quantity);
                return ResponseEntity.noContent().build();
        }
}