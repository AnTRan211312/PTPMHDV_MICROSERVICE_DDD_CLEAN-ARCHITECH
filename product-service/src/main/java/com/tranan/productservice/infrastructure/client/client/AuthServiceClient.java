package com.tranan.productservice.infrastructure.client.client;

import com.tranan.productservice.infrastructure.client.dto.UserInfoResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * GỌI TRỰC TIẾP - KHÔNG CẦN TOKEN!
 * Cache user info để giảm tải cho AuthService
 * Circuit Breaker để tránh cascade failure
 */
@FeignClient(
        name = "auth-service",
        fallbackFactory = AuthServiceClientFallbackFactory.class
)
public interface AuthServiceClient {

    @Cacheable(value = "userInfo", key = "#email", unless = "#result == null")
    @GetMapping("/api/internal/users/{email}")
    UserInfoResponse getUserByEmail(@PathVariable String email);

    @GetMapping("/api/internal/users/batch")
    List<UserInfoResponse> getUsersByEmails(@RequestParam List<String> emails);
}