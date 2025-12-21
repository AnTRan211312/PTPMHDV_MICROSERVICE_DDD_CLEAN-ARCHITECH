package com.tranan.orderservice.domain.model;

import java.util.Arrays;
import java.util.List;

/**
 * Enum định nghĩa các trạng thái của đơn hàng
 */
public enum OrderStatus {

    PENDING_PAYMENT("Chờ thanh toán"),
    PAID("Đã thanh toán"),
    SHIPPING("Đang giao hàng"),
    DELIVERED("Đã giao hàng"),
    COMPLETED("Hoàn thành"),
    CANCELLED("Đã hủy");

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Kiểm tra xem có thể chuyển đổi sang trạng thái mới không
     * 
     * @param newStatus trạng thái mới muốn chuyển đến
     * @return true nếu chuyển đổi hợp lệ
     */
    public boolean canTransitionTo(OrderStatus newStatus) {
        return getValidTransitions().contains(newStatus);
    }

    /**
     * Lấy danh sách các trạng thái có thể chuyển đến từ trạng thái hiện tại
     * 
     * @return danh sách trạng thái hợp lệ
     */
    public List<OrderStatus> getValidTransitions() {
        return switch (this) {
            case PENDING_PAYMENT -> Arrays.asList(PAID, CANCELLED);
            case PAID -> Arrays.asList(SHIPPING, CANCELLED);
            case SHIPPING -> Arrays.asList(DELIVERED);
            case DELIVERED -> Arrays.asList(COMPLETED);
            case COMPLETED, CANCELLED -> Arrays.asList(); // Terminal states
        };
    }

    /**
     * Kiểm tra trạng thái có phải là terminal (không thể chuyển tiếp) không
     * 
     * @return true nếu là trạng thái kết thúc
     */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }

    /**
     * Parse từ string, trả về null nếu không hợp lệ
     * 
     * @param value string value
     * @return OrderStatus hoặc null
     */
    public static OrderStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OrderStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
