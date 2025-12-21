package com.tranan.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtGrantedAuthoritiesConverterAdapter;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class GatewayAuthConfiguration {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final MacAlgorithm MAC_ALGORITHM = MacAlgorithm.HS512;

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        SecretKey secretKey = getSecretKey();
        return NimbusReactiveJwtDecoder
                .withSecretKey(secretKey)
                .macAlgorithm(MAC_ALGORITHM)
                .build();
    }

    @Bean
    public ReactiveJwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("permissions");

        ReactiveJwtAuthenticationConverter converter = new ReactiveJwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(
                new ReactiveJwtGrantedAuthoritiesConverterAdapter(grantedAuthoritiesConverter));
        return converter;
    }

    public SecretKey getSecretKey() {
        // CŨ (Xóa dòng này):
        // byte[] keyBytes = Base64.from(jwtKey).decode();

        // MỚI (Sửa thành dòng này): Lấy byte trực tiếp để khớp với Gateway
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);

        return new SecretKeySpec(keyBytes, "HmacSHA512");
    }

    // private SecretKey getSecretKey() {
    // byte[] keyBytes = Base64.from(jwtSecret).decode();
    // return new SecretKeySpec(keyBytes, 0, keyBytes.length,
    // MAC_ALGORITHM.getName());
    // }
}