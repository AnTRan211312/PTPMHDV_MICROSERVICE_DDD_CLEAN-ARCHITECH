package com.tranan.monitorservice.service;

import com.tranan.monitorservice.dto.ServiceHealth;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for managing and retrieving health status of microservices.
 * Provides methods to query health information from Eureka and health check endpoints.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 */
public interface HealthService {

    /**
     * Get health status of all registered services with pagination support.
     * 
     * @param pageable Pagination information (page number, size, sorting)
     * @return Page containing ServiceHealth records for all registered services
     * 
     * Validates: Requirements 1.1
     */
    Page<ServiceHealth> getAllServicesHealth(Pageable pageable);

    /**
     * Get health status of a specific service.
     * Queries the service's health endpoint with a 5-second timeout.
     * 
     * @param serviceName The name of the service to check
     * @return ServiceHealth containing the health status of the specified service
     * @throws ServiceNotFoundException if the service is not registered in Eureka
     * 
     * Validates: Requirements 1.2
     */
    ServiceHealth getServiceHealth(String serviceName);

    /**
     * Get list of all registered services from Eureka.
     * 
     * @return List of service names registered in Eureka
     * 
     * Validates: Requirements 1.3
     */
    List<String> getRegisteredServices();
}
