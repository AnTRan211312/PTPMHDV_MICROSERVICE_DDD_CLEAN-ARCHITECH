package com.tranan.paymentservice.infrastructure.config.kafka.config;

import com.tranan.paymentservice.infrastructure.config.kafka.event.OrderPaidEvent;
import com.tranan.paymentservice.infrastructure.config.kafka.event.PaymentEvent;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.producer.acks:1}")
    private String acks;

    @Value("${spring.kafka.producer.retries:3}")
    private int retries;

    @Value("${spring.kafka.producer.batch-size:16384}")
    private int batchSize;

    @Value("${spring.kafka.producer.linger-ms:10}")
    private int lingerMs;

    @Value("${spring.kafka.producer.buffer-memory:33554432}")
    private int bufferMemory;

    private Map<String, Object> getProducerConfig() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(ProducerConfig.ACKS_CONFIG, acks);
        configProps.put(ProducerConfig.RETRIES_CONFIG, retries);
        configProps.put(ProducerConfig.BATCH_SIZE_CONFIG, batchSize);
        configProps.put(ProducerConfig.LINGER_MS_CONFIG, lingerMs);
        configProps.put(ProducerConfig.BUFFER_MEMORY_CONFIG, bufferMemory);
        configProps.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return configProps;
    }

    // 1. ProducerFactory cho Object
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        return new DefaultKafkaProducerFactory<>(getProducerConfig());
    }

    // 2. KafkaTemplate chung
    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // 3. ProducerFactory cho OrderPaidEvent
    @Bean
    public ProducerFactory<String, OrderPaidEvent> orderPaidEventProducerFactory() {
        return new DefaultKafkaProducerFactory<>(getProducerConfig());
    }

    // 4. KafkaTemplate cho OrderPaidEvent
    @Bean
    public KafkaTemplate<String, OrderPaidEvent> orderPaidEventKafkaTemplate() {
        return new KafkaTemplate<>(orderPaidEventProducerFactory());
    }

    // 5. ProducerFactory cho PaymentEvent
    @Bean
    public ProducerFactory<String, PaymentEvent> paymentEventProducerFactory() {
        return new DefaultKafkaProducerFactory<>(getProducerConfig());
    }

    // 6. KafkaTemplate cho PaymentEvent
    @Bean
    public KafkaTemplate<String, PaymentEvent> paymentEventKafkaTemplate() {
        return new KafkaTemplate<>(paymentEventProducerFactory());
    }
}