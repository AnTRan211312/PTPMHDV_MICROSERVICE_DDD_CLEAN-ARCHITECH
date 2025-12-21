package com.tranan.apigateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;

/**
 * Gateway Security Configuration
 * - Xử lý authentication/authorization tập trung
 * - Validate JWT token từ client
 * - Route request đến các microservices
 */
@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class GatewaySecurityConfiguration {

        private final ServerAuthenticationEntryPoint customAuthenticationEntryPoint;

        // Public routes - không cần authentication
        private static final String[] PUBLIC_ROUTES = {
                        // Login / Register
                        "/api/auth/login",
                        "/api/auth/register",
                        "/api/auth/refresh-token",
                        "/api/auth/logout",
                        "/api/auth/forgot-password",
                        "/api/auth/verify-otp",
                        "/api/auth/resend-otp",
                        "/api/auth/reset-password",
                        "/api/auth/**",

                        // Payment Callback (VNPAY không gửi token)
                        "/api/payments/callback",

                        // Docs & Monitor
                        "/actuator/**",

                        // Swagger UI - THÊM CÁC PATH NÀY
                        "/swagger-ui.html", // ← THÊM
                        "/swagger-ui/**",
                        "/webjars/**", // ← THÊM (Swagger dependencies)
                        "/v3/api-docs/**",
                        "/v3/api-docs", // ← THÊM
                        "/swagger-resources/**", // ← THÊM (nếu dùng Swagger 2.x)
                        "/configuration/**"
        };

        @Bean
        public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
                return http
                                // Authorization rules
                                .authorizeExchange(exchange -> exchange
                                                .pathMatchers("/api/internal/**").denyAll()
                                                .pathMatchers(PUBLIC_ROUTES).permitAll()
                                                .pathMatchers(HttpMethod.GET, "/api/categories/**", "/api/reviews/**",
                                                                "/api/inventory/{productId}")
                                                .permitAll()
                                                .pathMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                                                .pathMatchers(HttpMethod.OPTIONS).permitAll() // CORS preflight
                                                .anyExchange().authenticated() // Tất cả request khác cần token
                                )
                                // JWT validation
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .jwt(Customizer.withDefaults())
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                // Disable CSRF (stateless API)
                                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                                .build();
        }
}