package com.tranan.productservice.infrastructure.config.network;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;


import java.time.Duration;


@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.password}")
    private String redisPassword;


    // =====================================================================
    // 1. Kết nối tới Redis
    //    - Định nghĩa RedisConnectionFactory với host, port, password, database
    //    - Bean này dùng chung cho RedisTemplate & Spring Cache
    // =====================================================================
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration serverConfig =
                new RedisStandaloneConfiguration(redisHost, redisPort);

        if (!redisPassword.isBlank()) {
            serverConfig.setPassword(RedisPassword.of(redisPassword));
        }

        return new LettuceConnectionFactory(serverConfig);
    }




    // =====================================================================
    // 4. Cấu hình Spring Cache với Redis
    //    - Thiết lập thời gian sống mặc định cho cache (TTL)
    //    - Dùng JSON serialization thay vì Java serialization
    //    - Chỉ áp dụng cho các cache dùng annotation (@Cacheable, @CacheEvict...)
    // =====================================================================
    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        // Tạo ObjectMapper với hỗ trợ Java 8 Time
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL
        );

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(15))
                .disableCachingNullValues()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer(objectMapper))
                );
    }

    // =====================================================================
    // 5. Khởi tạo CacheManager sử dụng Redis
    //    - Quản lý cache thông qua Spring Cache (annotation)
    //    - Tự động áp dụng các cấu hình phía trên cho toàn bộ cache
    // =====================================================================
    @Bean
    public RedisCacheManager cacheManager(
            RedisConnectionFactory factory,
            RedisCacheConfiguration cacheConfiguration) {
        RedisCacheManager cacheManager = RedisCacheManager.builder(factory)
                .cacheDefaults(cacheConfiguration)
                .transactionAware()
                .build();
        
        // Clear all caches on startup to avoid deserialization issues
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        });
        
        return cacheManager;
    }
}
