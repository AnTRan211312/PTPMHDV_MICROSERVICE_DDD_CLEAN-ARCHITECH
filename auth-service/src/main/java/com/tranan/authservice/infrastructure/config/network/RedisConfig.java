package com.tranan.authservice.infrastructure.config.network;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;


@Configuration
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
    // 2. RedisTemplate cho SessionMeta (Authentication sessions)
    // =====================================================================
    @Bean
    public RedisTemplate<String, SessionMeta> redisSessionMetaTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, SessionMeta> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // KEY
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // VALUE
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        Jackson2JsonRedisSerializer<SessionMeta> valueSerializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, SessionMeta.class);

        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);

        return template;
    }

    // =====================================================================
    // 3. RedisTemplate cho OTP (String-String)
    // =====================================================================
    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // KEY và VALUE đều dùng StringRedisSerializer
        StringRedisSerializer serializer = new StringRedisSerializer();
        template.setKeySerializer(serializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(serializer);
        template.setHashValueSerializer(serializer);

        return template;
    }

    // =====================================================================
    // 4. Cấu hình Spring Cache với Redis
    //    - Thiết lập thời gian sống mặc định cho cache (TTL)
    //    - Chỉ áp dụng cho các cache dùng annotation (@Cacheable, @CacheEvict...)
    // =====================================================================
    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(15))
                .disableCachingNullValues();
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
        return RedisCacheManager.builder(factory)
                .cacheDefaults(cacheConfiguration)
                .transactionAware()
                .build();
    }
}
