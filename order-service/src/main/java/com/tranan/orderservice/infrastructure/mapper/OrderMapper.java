package com.tranan.orderservice.infrastructure.mapper;

import com.tranan.orderservice.domain.model.Order;
import com.tranan.orderservice.domain.model.OrderItem;
import com.tranan.orderservice.infrastructure.entity.OrderEntity;
import com.tranan.orderservice.infrastructure.entity.OrderItemEntity;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public OrderEntity toEntity(Order order) {
        if (order == null) {
            return null;
        }

        OrderEntity entity = OrderEntity.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .build();

        if (order.getItems() != null) {
            order.getItems().forEach(item -> {
                OrderItemEntity itemEntity = toItemEntity(item);
                entity.addItem(itemEntity);
            });
        }

        return entity;
    }

    public Order toDomain(OrderEntity entity) {
        if (entity == null) {
            return null;
        }

        return Order.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .orderCode(entity.getOrderCode())
                .items(entity.getItems().stream()
                        .map(this::toItemDomain)
                        .collect(Collectors.toList()))
                .totalAmount(entity.getTotalAmount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private OrderItemEntity toItemEntity(OrderItem item) {
        return OrderItemEntity.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productDescription(item.getProductDescription())
                .productImage(item.getProductImage())
                .price(item.getPrice())
                .discountPrice(item.getDiscountPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }

    private OrderItem toItemDomain(OrderItemEntity entity) {
        return OrderItem.builder()
                .id(entity.getId())
                .orderId(entity.getOrder() != null ? entity.getOrder().getId() : null)
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .productDescription(entity.getProductDescription())
                .productImage(entity.getProductImage())
                .price(entity.getPrice())
                .discountPrice(entity.getDiscountPrice())
                .quantity(entity.getQuantity())
                .subtotal(entity.getSubtotal())
                .build();
    }
}
