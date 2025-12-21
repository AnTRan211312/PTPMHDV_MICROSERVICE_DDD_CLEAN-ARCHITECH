package com.tranan.inventoryservice.application.usecase;

import com.tranan.inventoryservice.application.dto.request.CreateInventoryRequest;
import com.tranan.inventoryservice.application.dto.request.UpdateInventoryRequest;
import com.tranan.inventoryservice.application.dto.response.InventoryResponse;
import com.tranan.inventoryservice.application.dto.response.StockCheckResponse;
import com.tranan.inventoryservice.domain.model.Inventory;
import com.tranan.inventoryservice.domain.repository.InventoryRepository;
import com.tranan.inventoryservice.infrastructure.client.client.ProductClient;
import com.tranan.inventoryservice.infrastructure.client.dto.InventoryQuantityResponse;
import com.tranan.inventoryservice.presentation.advice.exception.InventoryNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

/**
 * Inventory Application Service
 * Chứa tất cả business logic cho Inventory management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductClient productClient;

    // ═════════════════════════════════════════════════════════════════════
    // 1. CRUD OPERATIONS (QUẢN LÝ KHO)
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Tạo inventory mới cho product
     * SỬA ĐỔI: Nhận productId từ tham số (Do Controller truyền xuống từ URL)
     */
    @Transactional
    public InventoryResponse createInventory(Long productId, CreateInventoryRequest request) {

        // 1. GỌI CHECK BÊN PRODUCT SERVICE (External Call)
        log.info("Checking product existence for ID: {}", productId);
        try {
            Map<String, Boolean> response = productClient.checkProductExists(productId);
            if (response == null || !response.getOrDefault("exists", false)) {
                throw new IllegalArgumentException(
                        "Không thể tạo kho: Sản phẩm ID " + productId
                                + " không tồn tại hoặc hệ thống sản phẩm đang bảo trì.");
            }
        } catch (Exception e) {
            log.error("Error checking product existence: {}", e.getMessage());
            throw new IllegalArgumentException(
                    "Không thể tạo kho: Không thể kết nối đến hệ thống sản phẩm.");
        }

        // 2. Check trùng trong Inventory (Internal Check)
        if (inventoryRepository.existsByProductId(productId)) {
            throw new IllegalStateException(
                    "Kho hàng cho sản phẩm " + productId + " đã tồn tại! Vui lòng dùng chức năng Cập nhật.");
        }

        // 3. Tạo mới
        Inventory inventory = Inventory.builder()
                .productId(productId) // Lấy từ tham số hàm
                .quantity(request.getQuantity()) // Lấy từ Body request
                .build();

        inventory = inventoryRepository.save(inventory);
        log.info("Created inventory for product {}: {} units", productId, request.getQuantity());

        return toResponse(inventory);
    }

    /**
     * Lấy inventory theo productId (Dùng cho trang chi tiết sản phẩm)
     */
    @Transactional(readOnly = true)
    public InventoryResponse getInventory(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(
                        "Inventory not found for product: " + productId));

        return toResponse(inventory);
    }

    /**
     * Lấy danh sách inventory (Dùng cho Admin quản lý)
     * FIX N+1: Batch fetch tên sản phẩm thay vì loop gọi ProductClient N lần
     * HỖ TRỢ: Tìm kiếm theo productId, keyword (tên sản phẩm), hoặc stockStatus
     * (trạng thái tồn kho)
     * 
     * @param stockStatus: OUT_OF_STOCK (hết hàng), LOW_STOCK (sắp hết), IN_STOCK
     *                     (còn hàng)
     */
    @Transactional(readOnly = true)
    public Page<InventoryResponse> getAllInventories(Long productId, String keyword, String stockStatus,
            Pageable pageable) {
        Page<Inventory> inventoryPage;

        // Filter theo trạng thái tồn kho (ưu tiên cao nhất)
        if (stockStatus != null && !stockStatus.trim().isEmpty()) {
            switch (stockStatus.trim().toUpperCase()) {
                case "OUT_OF_STOCK":
                    inventoryPage = inventoryRepository.findOutOfStock(pageable);
                    break;
                case "LOW_STOCK":
                    inventoryPage = inventoryRepository.findLowStock(pageable);
                    break;
                case "IN_STOCK":
                    inventoryPage = inventoryRepository.findInStock(pageable);
                    break;
                default:
                    inventoryPage = inventoryRepository.findAll(pageable);
            }
        } else if (productId != null) {
            // Tìm theo productId cụ thể
            inventoryPage = inventoryRepository.findAllByProductId(productId, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            // Tìm theo keyword - gọi Product Service để lấy danh sách productIds khớp với
            // tên
            List<Long> matchingProductIds = productClient.searchProductIdsByName(keyword.trim());
            if (matchingProductIds.isEmpty()) {
                return Page.empty(pageable);
            }
            inventoryPage = inventoryRepository.findAllByProductIdIn(matchingProductIds, pageable);
        } else {
            inventoryPage = inventoryRepository.findAll(pageable);
        }

        // FIX N+1: Batch fetch tên sản phẩm 1 lần thay vì N lần
        List<Long> productIds = inventoryPage.getContent().stream()
                .map(Inventory::getProductId)
                .toList();

        Map<Long, String> productNameMap = new java.util.HashMap<>();
        try {
            List<com.tranan.inventoryservice.infrastructure.client.dto.ProductDTO> products = productClient
                    .getProductsByIds(productIds);
            for (com.tranan.inventoryservice.infrastructure.client.dto.ProductDTO product : products) {
                productNameMap.put(product.getId(), product.getName());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch product names: {}", e.getMessage());
        }

        // Map responses với tên sản phẩm
        return inventoryPage.map(inventory -> {
            String productName = productNameMap.getOrDefault(inventory.getProductId(), "Unknown");
            return InventoryResponse.builder()
                    .id(inventory.getId())
                    .productId(inventory.getProductId())
                    .productName(productName)
                    .quantity(inventory.getQuantity())
                    .createdAt(inventory.getCreatedAt())
                    .updatedAt(inventory.getUpdatedAt())
                    .build();
        });
    }

    /**
     * Update inventory
     */
    @Transactional
    public InventoryResponse updateInventory(Long productId, UpdateInventoryRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(
                        "Inventory not found for product: " + productId));

        inventory.setQuantity(request.getQuantity());

        inventory = inventoryRepository.save(inventory);
        log.info("Updated inventory for product {}: {} units", productId, request.getQuantity());

        return toResponse(inventory);
    }

    /**
     * Xóa inventory
     */
    @Transactional
    public void deleteInventory(Long productId) {
        if (!inventoryRepository.existsByProductId(productId)) {
            throw new InventoryNotFoundException(
                    "Inventory not found for product: " + productId);
        }

        inventoryRepository.deleteByProductId(productId);
        log.info("Deleted inventory for product {}", productId);
    }

    // ═════════════════════════════════════════════════════════════════════
    // 2. BUSINESS OPERATIONS (XỬ LÝ ĐẶT HÀNG/CHECK KHO)
    // ═════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public StockCheckResponse checkStock(Long productId, Integer quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException("Inventory not found: " + productId));

        boolean available = inventory.hasStock(quantity);

        return StockCheckResponse.builder()
                .productId(productId)
                .available(available)
                .quantityAvailable(inventory.getQuantity())
                .requestedQuantity(quantity)
                .message(available
                        ? "Stock available"
                        : "Only " + inventory.getQuantity() + " units available")
                .build();
    }

    @Transactional(readOnly = true)
    public Map<Long, StockCheckResponse> checkMultipleStock(Map<Long, Integer> productQuantities) {
        List<Long> productIds = productQuantities.keySet().stream().toList();
        List<Inventory> inventories = inventoryRepository.findByProductIdIn(productIds);

        Map<Long, Inventory> inventoryMap = inventories.stream()
                .collect(Collectors.toMap(Inventory::getProductId, inv -> inv));

        log.debug("Checking stock for {} products", productQuantities.size());

        return productQuantities.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            Long productId = entry.getKey();
                            Integer requestedQty = entry.getValue();
                            Inventory inventory = inventoryMap.get(productId);

                            if (inventory == null) {
                                return StockCheckResponse.builder()
                                        .productId(productId)
                                        .available(false)
                                        .quantityAvailable(0)
                                        .requestedQuantity(requestedQty)
                                        .message("Product not found in inventory")
                                        .build();
                            }

                            boolean available = inventory.hasStock(requestedQty);
                            return StockCheckResponse.builder()
                                    .productId(productId)
                                    .available(available)
                                    .quantityAvailable(inventory.getQuantity())
                                    .requestedQuantity(requestedQty)
                                    .message(available ? "Available" : "Insufficient stock")
                                    .build();
                        }));
    }

    @Transactional
    public void reduceStock(Long productId, Integer quantity) {
        // Validate product exists
        if (!inventoryRepository.findByProductId(productId).isPresent()) {
            throw new InventoryNotFoundException(
                    "Inventory not found for product: " + productId);
        }

        // Use batch update query instead of fetch + update
        inventoryRepository.reduceStockByProductId(productId, quantity);
        log.info("Reduced stock for product {}: -{} units", productId, quantity);
    }

    @Transactional
    public void reduceMultipleStock(Map<Long, Integer> productQuantities) {
        log.info("Reducing stock for {} products", productQuantities.size());

        // FIX N+1: Batch fetch tất cả inventories để validate
        List<Long> productIds = new java.util.ArrayList<>(productQuantities.keySet());
        List<Inventory> inventories = inventoryRepository.findByProductIdIn(productIds);

        // Validate tất cả products tồn tại
        if (inventories.size() != productIds.size()) {
            throw new InventoryNotFoundException(
                    "Some products not found in inventory");
        }

        // Batch update sử dụng native query (1 query thay vì N queries)
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            inventoryRepository.reduceStockByProductId(entry.getKey(), entry.getValue());
            log.info("Reduced stock for product {}: -{} units", entry.getKey(), entry.getValue());
        }

        log.info("Successfully reduced stock for all products");
    }

    @Transactional
    public void restoreStock(Long productId, Integer quantity) {
        // Validate product exists
        if (!inventoryRepository.findByProductId(productId).isPresent()) {
            throw new InventoryNotFoundException(
                    "Inventory not found for product: " + productId);
        }

        // Use batch update query instead of fetch + update
        inventoryRepository.restoreStockByProductId(productId, quantity);
        log.info("Restored stock for product {}: +{} units", productId, quantity);
    }

    @Transactional
    public void restoreMultipleStock(Map<Long, Integer> productQuantities) {
        log.info("Restoring stock for {} products", productQuantities.size());

        // FIX N+1: Batch fetch tất cả inventories để validate
        List<Long> productIds = new java.util.ArrayList<>(productQuantities.keySet());
        List<Inventory> inventories = inventoryRepository.findByProductIdIn(productIds);

        // Validate tất cả products tồn tại
        if (inventories.size() != productIds.size()) {
            throw new InventoryNotFoundException(
                    "Some products not found in inventory");
        }

        // Batch update sử dụng native query (1 query thay vì N queries)
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            inventoryRepository.restoreStockByProductId(entry.getKey(), entry.getValue());
            log.info("Restored stock for product {}: +{} units", entry.getKey(), entry.getValue());
        }

        log.info("Successfully restored stock for all products");
    }

    // ═════════════════════════════════════════════════════════════════════
    // 3. HELPER METHOD
    // ═════════════════════════════════════════════════════════════════════

    private InventoryResponse toResponse(Inventory inventory) {
        try {
            // Lấy tên sản phẩm từ Product Service
            String productName = productClient.getProductName(inventory.getProductId());

            return InventoryResponse.builder()
                    .id(inventory.getId())
                    .productId(inventory.getProductId())
                    .productName(productName) // Thêm tên sản phẩm
                    .quantity(inventory.getQuantity())
                    .createdAt(inventory.getCreatedAt())
                    .updatedAt(inventory.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            log.error("Error getting product name for productId {}: {}",
                    inventory.getProductId(), e.getMessage());

            // Fallback: vẫn trả về response nhưng productName là rỗng
            return InventoryResponse.builder()
                    .id(inventory.getId())
                    .productId(inventory.getProductId())
                    .productName("Unknown") // Hoặc có thể để "" tùy bạn
                    .quantity(inventory.getQuantity())
                    .createdAt(inventory.getCreatedAt())
                    .updatedAt(inventory.getUpdatedAt())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public Integer getQuantityByProductId(Long productId) {
        return inventoryRepository.getQuantityByProductId(productId);
    }

    @Transactional(readOnly = true)
    public List<InventoryQuantityResponse> getQuantitiesByProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }
        return inventoryRepository.getQuantitiesByProductIds(productIds);
    }

    /**
     * Lấy thống kê tồn kho tổng hợp
     */
    @Transactional(readOnly = true)
    public com.tranan.inventoryservice.application.dto.response.InventoryStatsResponse getStats() {
        long total = inventoryRepository.countTotal();
        long lowStock = inventoryRepository.countLowStock();
        long outOfStock = inventoryRepository.countOutOfStock();

        return com.tranan.inventoryservice.application.dto.response.InventoryStatsResponse.builder()
                .total(total)
                .lowStock(lowStock)
                .outOfStock(outOfStock)
                .build();
    }
}