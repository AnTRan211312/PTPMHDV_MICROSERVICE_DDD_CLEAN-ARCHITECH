package com.tranan.productservice.infrastructure.client.client;

import com.tranan.productservice.infrastructure.client.dto.UserInfoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback khi AuthService không khả dụng
 * Trả về thông tin mặc định thay vì throw exception
 */
@Slf4j
@Component
public class AuthServiceClientFallbackFactory implements FallbackFactory<AuthServiceClient> {

    @Override
    public AuthServiceClient create(Throwable cause) {
        return new AuthServiceClient() {
            @Override
            public UserInfoResponse getUserByEmail(String email) {
                log.warn("AuthService unavailable for email: {}. Reason: {}", 
                        email, cause.getMessage());
                
                // Trả về user info mặc định
                UserInfoResponse fallback = new UserInfoResponse();
                fallback.setEmail(email);
                fallback.setName("Unknown User");
                fallback.setAvatar(null);
                return fallback;
            }

            @Override
            public List<UserInfoResponse> getUsersByEmails(List<String> emails) {
                log.warn("AuthService unavailable for batch request. Reason: {}", 
                        cause.getMessage());
                
                // Trả về danh sách rỗng hoặc user mặc định
                return Collections.emptyList();
            }
        };
    }
}
