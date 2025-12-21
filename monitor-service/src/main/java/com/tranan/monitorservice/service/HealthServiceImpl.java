package com.tranan.monitorservice.service;

import com.tranan.monitorservice.dto.HealthStatus;
import com.tranan.monitorservice.dto.ServiceHealth;
import com.tranan.monitorservice.exception.ServiceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of HealthService for retrieving microservice health status.
 * Integrates with Eureka for service discovery and queries health endpoints.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class HealthServiceImpl implements HealthService {

    private final DiscoveryClient discoveryClient;
    private final RestTemplate restTemplate;

    /**
     * Get health status of all registered services with pagination.
     * Results are cached for 60 seconds to reduce load on health endpoints.
     * 
     * Validates: Requirements 1.1
     */
    @Override
    @Cacheable(value = "health", key = "'all_' + #pageable.pageNumber + '_' + #pageable.pageSize", unless = "#result.isEmpty()")
    public Page<ServiceHealth> getAllServicesHealth(Pageable pageable) {
        log.debug("Fetching health status for all services");

        List<String> services = getRegisteredServices();

        List<ServiceHealth> healthStatuses = services.stream()
                .map(this::getServiceHealthInternal)
                .collect(Collectors.toList());

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), healthStatuses.size());

        List<ServiceHealth> pageContent = healthStatuses.subList(start, end);

        return new PageImpl<>(pageContent, pageable, healthStatuses.size());
    }

    /**
     * Get health status of a specific service.
     * Queries the service's /actuator/health endpoint with a 5-second timeout.
     * If the service is unreachable, returns DOWN status.
     * 
     * Validates: Requirements 1.2
     */
    @Override
    @Cacheable(value = "health", key = "#serviceName")
    public ServiceHealth getServiceHealth(String serviceName) {
        log.debug("Fetching health status for service: {}", serviceName);

        List<ServiceInstance> instances = discoveryClient.getInstances(serviceName);
        if (instances.isEmpty()) {
            throw new ServiceNotFoundException(serviceName);
        }

        return getServiceHealthInternal(serviceName);
    }

    /**
     * Get list of all registered services from Eureka.
     * 
     * Validates: Requirements 1.3
     */
    @Override
    public List<String> getRegisteredServices() {
        log.debug("Fetching list of registered services from Eureka");
        return discoveryClient.getServices();
    }

    /**
     * Internal method to get health status for a service.
     * Attempts to query the service's health endpoint.
     * If unreachable, returns DOWN status.
     * 
     * @param serviceName The name of the service
     * @return ServiceHealth with status UP, DOWN, or UNKNOWN
     */
    private ServiceHealth getServiceHealthInternal(String serviceName) {
        try {
            List<ServiceInstance> instances = discoveryClient.getInstances(serviceName);

            if (instances.isEmpty()) {
                log.warn("No instances found for service: {}", serviceName);
                return createDownServiceHealth(serviceName, "No instances registered");
            }

            ServiceInstance instance = instances.get(0);
            String host = instance.getHost();
            int port = instance.getPort();

            // Try standard port first
            try {
                return checkHealth(serviceName, instance.getInstanceId(), host, port);
            } catch (RestClientException e) {
                // If standard port fails, try management port (assuming convention port - 3000)
                int managementPort = port - 3000;
                if (managementPort > 0) {
                    try {
                        log.debug("Standard port failed for {}, trying management port {}", serviceName,
                                managementPort);
                        return checkHealth(serviceName, instance.getInstanceId(), host, managementPort);
                    } catch (RestClientException ex) {
                        log.warn("Failed to query health endpoint for service {} on both ports {} and {}: {}",
                                serviceName, port, managementPort, ex.getMessage());
                        return createDownServiceHealth(serviceName,
                                "Health endpoint unreachable on ports " + port + " and " + managementPort);
                    }
                }
                throw e;
            }
        } catch (Exception e) {
            log.error("Error checking health for service {}: {}", serviceName, e.getMessage());
            return createUnknownServiceHealth(serviceName, "Error during health check: " + e.getMessage());
        }
    }

    private ServiceHealth checkHealth(String serviceName, String instanceId, String host, int port) {
        String healthUrl = String.format("http://%s:%d/actuator/health", host, port);
        @SuppressWarnings("unchecked")
        Map<String, Object> healthResponse = restTemplate.getForObject(healthUrl, Map.class);

        if (healthResponse != null && "UP".equals(healthResponse.get("status"))) {
            return createUpServiceHealth(serviceName, instanceId, healthResponse);
        } else {
            return createDownServiceHealth(serviceName, "Health check returned non-UP status");
        }
    }

    /**
     * Create a ServiceHealth record with UP status.
     */
    private ServiceHealth createUpServiceHealth(String serviceName, String instanceId, Map<String, Object> details) {
        return new ServiceHealth(
                serviceName,
                HealthStatus.UP,
                Instant.now(),
                instanceId,
                0L, // Uptime would require additional metrics
                details != null ? details : new HashMap<>());
    }

    /**
     * Create a ServiceHealth record with DOWN status.
     */
    private ServiceHealth createDownServiceHealth(String serviceName, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("reason", reason);

        return new ServiceHealth(
                serviceName,
                HealthStatus.DOWN,
                Instant.now(),
                "unknown",
                0L,
                details);
    }

    /**
     * Create a ServiceHealth record with UNKNOWN status.
     */
    private ServiceHealth createUnknownServiceHealth(String serviceName, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("reason", reason);

        return new ServiceHealth(
                serviceName,
                HealthStatus.UNKNOWN,
                Instant.now(),
                "unknown",
                0L,
                details);
    }
}
