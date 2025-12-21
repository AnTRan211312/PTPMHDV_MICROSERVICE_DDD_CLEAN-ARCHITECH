package com.tranan.orderservice.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    private Long id;
    private Long userId;
    private String orderCode;

    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    private BigDecimal totalAmount;
    private OrderStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public void addItem(OrderItem item) {
        this.items.add(item);
    }

    public int getTotalItemCount() {
        return items.stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();
    }

    /**
     * Chuyển đổi trạng thái đơn hàng với validation
     * 
     * @param newStatus trạng thái mới
     * @throws IllegalStateException nếu chuyển đổi không hợp lệ
     */
    public void transitionTo(OrderStatus newStatus) {
        if (this.status == null) {
            throw new IllegalStateException("Trạng thái hiện tại không xác định");
        }
        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Không thể chuyển từ trạng thái '%s' sang '%s'. Các trạng thái hợp lệ: %s",
                            this.status.getDisplayName(),
                            newStatus.getDisplayName(),
                            this.status.getValidTransitions()));
        }
        this.status = newStatus;
        this.updatedAt = Instant.now();
    }

    /**
     * Hủy đơn hàng
     */
    public void cancel() {
        transitionTo(OrderStatus.CANCELLED);
    }

    /**
     * Đánh dấu đã thanh toán
     */
    public void markAsPaid() {
        transitionTo(OrderStatus.PAID);
    }

    /**
     * Chuyển sang trạng thái đang giao hàng
     */
    public void ship() {
        transitionTo(OrderStatus.SHIPPING);
    }

    /**
     * Đánh dấu đã giao hàng
     */
    public void deliver() {
        transitionTo(OrderStatus.DELIVERED);
    }

    /**
     * Hoàn thành đơn hàng
     */
    public void complete() {
        transitionTo(OrderStatus.COMPLETED);
    }

    /**
     * Kiểm tra có thể hủy đơn hàng không
     */
    public boolean canBeCancelled() {
        return this.status != null && this.status.canTransitionTo(OrderStatus.CANCELLED);
    }

    /**
     * Lấy tên hiển thị của trạng thái
     */
    public String getStatusDisplayName() {
        return this.status != null ? this.status.getDisplayName() : "Không xác định";
    }
}
