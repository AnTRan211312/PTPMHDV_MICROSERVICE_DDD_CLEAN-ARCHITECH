package com.tranan.monitorservice.controller;

import com.tranan.monitorservice.annotation.ApiMessage;
import com.tranan.monitorservice.dto.ServiceHealth;
import com.tranan.monitorservice.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller exposing health information for registered microservices.
 */
@RestController
@RequestMapping("/api/monitor/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;

    /**
     * Get paginated health status for all registered services.
     */
    @GetMapping("/services")
    @ApiMessage("Fetched health status for all services")
    @PreAuthorize("hasAuthority('GET /api/monitor/health/services')")
    public ResponseEntity<Page<ServiceHealth>> getAllServicesHealth(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(healthService.getAllServicesHealth(pageable));
    }

    /**
     * Get health status for a specific service.
     */
    @GetMapping("/services/{serviceName}")
    @ApiMessage("Fetched health status for service")
    @PreAuthorize("hasAuthority('GET /api/monitor/health/services/{serviceName}')")
    public ResponseEntity<ServiceHealth> getServiceHealth(@PathVariable String serviceName) {
        return ResponseEntity.ok(healthService.getServiceHealth(serviceName));
    }

    /**
     * Get list of all registered services from Eureka.
     */
    @GetMapping("/services/registered")
    @ApiMessage("Fetched list of registered services")
    @PreAuthorize("hasAuthority('GET /api/monitor/health/services/registered')")
    public ResponseEntity<List<String>> getRegisteredServices() {
        return ResponseEntity.ok(healthService.getRegisteredServices());
    }
}
