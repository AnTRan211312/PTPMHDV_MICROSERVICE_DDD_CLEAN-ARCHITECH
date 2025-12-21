package com.tranan.monitorservice.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for RestTemplate bean used for HTTP requests.
 * Configures timeouts for health checks and Prometheus queries.
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Create a RestTemplate bean with configured timeouts.
     * Used for health checks and Prometheus queries.
     * 
     * @param builder RestTemplateBuilder for building the RestTemplate
     * @return Configured RestTemplate instance
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }
}
