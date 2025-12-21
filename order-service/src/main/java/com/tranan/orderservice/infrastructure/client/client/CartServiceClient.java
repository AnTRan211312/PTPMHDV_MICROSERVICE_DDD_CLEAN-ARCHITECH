package com.tranan.orderservice.infrastructure.client.client;

import com.tranan.orderservice.infrastructure.client.dto.CartResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "cart-service")
public interface CartServiceClient {
    
    @GetMapping("/api/carts/internal/{userId}")
    CartResponse getCartByUserId(@PathVariable("userId") Long userId);
    
    @DeleteMapping("/api/carts/internal/{userId}")
    void clearCart(@PathVariable("userId") Long userId);
    
    @DeleteMapping("/api/carts/internal/{userId}/items")
    void removeCartItems(@PathVariable("userId") Long userId, @RequestParam("itemIds") List<Long> itemIds);
    
    @DeleteMapping("/api/carts/internal/{userId}/items/products")
    void removeCartItemsByProductIds(@PathVariable("userId") Long userId, @RequestParam("productIds") List<Long> productIds);
}
