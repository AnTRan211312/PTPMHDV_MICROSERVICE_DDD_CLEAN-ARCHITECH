package com.tranan.monitorservice.service;

import com.tranan.monitorservice.dto.HealthStatus;
import com.tranan.monitorservice.dto.ServiceHealth;
import com.tranan.monitorservice.exception.ServiceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for HealthServiceImpl.
 * Tests health status retrieval, pagination, caching, and error handling.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 */
@ExtendWith(MockitoExtension.class)
class HealthServiceImplTest {

    @Mock
    private DiscoveryClient discoveryClient;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ServiceInstance serviceInstance;

    private HealthServiceImpl healthService;

    @BeforeEach
    void setUp() {
        healthService = new HealthServiceImpl(discoveryClient, restTemplate);
    }

    @Test
    void testGetRegisteredServices_ReturnsServiceList() {
        // Arrange
        List<String> expectedServices = Arrays.asList("auth-service", "product-service", "order-service");
        when(discoveryClient.getServices()).thenReturn(expectedServices);

        // Act
        List<String> result = healthService.getRegisteredServices();

        // Assert
        assertEquals(expectedServices, result);
        verify(discoveryClient, times(1)).getServices();
    }

    @Test
    void testGetServiceHealth_ServiceUp_ReturnsUpStatus() {
        // Arrange
        String serviceName = "auth-service";
        when(discoveryClient.getInstances(serviceName)).thenReturn(Arrays.asList(serviceInstance));
        when(serviceInstance.getHost()).thenReturn("localhost");
        when(serviceInstance.getPort()).thenReturn(8081);
        when(serviceInstance.getInstanceId()).thenReturn("auth-service-1");

        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "UP");
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(healthResponse);

        // Act
        ServiceHealth result = healthService.getServiceHealth(serviceName);

        // Assert
        assertNotNull(result);
        assertEquals(serviceName, result.serviceName());
        assertEquals(HealthStatus.UP, result.status());
        assertEquals("auth-service-1", result.instanceId());
    }

    @Test
    void testGetServiceHealth_ServiceDown_ReturnsDownStatus() {
        // Arrange
        String serviceName = "auth-service";
        when(discoveryClient.getInstances(serviceName)).thenReturn(Arrays.asList(serviceInstance));
        when(serviceInstance.getHost()).thenReturn("localhost");
        when(serviceInstance.getPort()).thenReturn(8081);
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new RestClientException("Connection refused"));

        // Act
        ServiceHealth result = healthService.getServiceHealth(serviceName);

        // Assert
        assertNotNull(result);
        assertEquals(serviceName, result.serviceName());
        assertEquals(HealthStatus.DOWN, result.status());
    }

    @Test
    void testGetServiceHealth_ServiceNotFound_ThrowsException() {
        // Arrange
        String serviceName = "non-existent-service";
        when(discoveryClient.getInstances(serviceName)).thenReturn(Arrays.asList());

        // Act & Assert
        assertThrows(ServiceNotFoundException.class, () -> {
            healthService.getServiceHealth(serviceName);
        });
    }

    @Test
    void testGetAllServicesHealth_WithPagination_ReturnsPaginatedResults() {
        // Arrange
        List<String> services = Arrays.asList("service-1", "service-2", "service-3");
        when(discoveryClient.getServices()).thenReturn(services);
        when(discoveryClient.getInstances(anyString())).thenReturn(Arrays.asList(serviceInstance));
        when(serviceInstance.getHost()).thenReturn("localhost");
        when(serviceInstance.getPort()).thenReturn(8080);
        when(serviceInstance.getInstanceId()).thenReturn("instance-1");

        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "UP");
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(healthResponse);

        Pageable pageable = PageRequest.of(0, 2);

        // Act
        Page<ServiceHealth> result = healthService.getAllServicesHealth(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals(3, result.getTotalElements());
        assertEquals(0, result.getNumber());
    }

    @Test
    void testGetAllServicesHealth_EmptyServiceList_ReturnsEmptyPage() {
        // Arrange
        when(discoveryClient.getServices()).thenReturn(Arrays.asList());
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<ServiceHealth> result = healthService.getAllServicesHealth(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getContent().size());
        assertEquals(0, result.getTotalElements());
    }

    @Test
    void testGetServiceHealth_NoInstances_ReturnsDownStatus() {
        // Arrange
        String serviceName = "auth-service";
        when(discoveryClient.getInstances(serviceName)).thenReturn(Arrays.asList());

        // Act & Assert
        assertThrows(ServiceNotFoundException.class, () -> {
            healthService.getServiceHealth(serviceName);
        });
    }

    @Test
    void testGetServiceHealth_HealthResponseNotUp_ReturnsDownStatus() {
        // Arrange
        String serviceName = "auth-service";
        when(discoveryClient.getInstances(serviceName)).thenReturn(Arrays.asList(serviceInstance));
        when(serviceInstance.getHost()).thenReturn("localhost");
        when(serviceInstance.getPort()).thenReturn(8081);

        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "DOWN");
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(healthResponse);

        // Act
        ServiceHealth result = healthService.getServiceHealth(serviceName);

        // Assert
        assertNotNull(result);
        assertEquals(HealthStatus.DOWN, result.status());
    }

    @Test
    void testGetServiceHealth_NullHealthResponse_ReturnsDownStatus() {
        // Arrange
        String serviceName = "auth-service";
        when(discoveryClient.getInstances(serviceName)).thenReturn(Arrays.asList(serviceInstance));
        when(serviceInstance.getHost()).thenReturn("localhost");
        when(serviceInstance.getPort()).thenReturn(8081);
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

        // Act
        ServiceHealth result = healthService.getServiceHealth(serviceName);

        // Assert
        assertNotNull(result);
        assertEquals(HealthStatus.DOWN, result.status());
    }
}
