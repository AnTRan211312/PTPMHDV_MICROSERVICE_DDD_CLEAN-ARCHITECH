package com.tranan.orderservice.infrastructure.repository.impl;

import com.tranan.orderservice.domain.model.Order;
import com.tranan.orderservice.domain.model.OrderStatus;
import com.tranan.orderservice.domain.repository.OrderRepository;
import com.tranan.orderservice.infrastructure.entity.OrderEntity;
import com.tranan.orderservice.infrastructure.mapper.OrderMapper;
import com.tranan.orderservice.infrastructure.repository.jpa.OrderJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {

    private final OrderJpaRepository jpaRepository;
    private final OrderMapper mapper;

    @Override
    public Order save(Order order) {
        OrderEntity entity = mapper.toEntity(order);
        OrderEntity savedEntity = jpaRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Order> findById(Long id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public int countOrdersByDate(LocalDate date) {
        Instant startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = startOfDay.plus(1, ChronoUnit.DAYS);

        return jpaRepository.countOrdersByDateRange(startOfDay, endOfDay);
    }

    @Override
    public Page<Order> findByUserId(Long userId, Pageable pageable) {
        return jpaRepository.findByUserId(userId, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public List<Order> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Page<Order> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable) {
        return jpaRepository.findByUserIdAndStatus(userId, status, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<Order> findByStatus(OrderStatus status, Pageable pageable) {
        return jpaRepository.findByStatus(status, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<Order> findAll(Pageable pageable) {
        return jpaRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public long countTotal() {
        return jpaRepository.countTotal();
    }

    @Override
    public long countByStatus(OrderStatus status) {
        return jpaRepository.countByStatus(status);
    }

    @Override
    public List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, Instant cutoffTime) {
        return jpaRepository.findByStatusAndCreatedAtBefore(status, cutoffTime).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Page<Order> searchByOrderCode(String keyword, Pageable pageable) {
        return jpaRepository.searchByOrderCode(keyword, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<Order> searchByOrderCodeAndStatus(String keyword, OrderStatus status, Pageable pageable) {
        return jpaRepository.searchByOrderCodeAndStatus(keyword, status, pageable)
                .map(mapper::toDomain);
    }
}
