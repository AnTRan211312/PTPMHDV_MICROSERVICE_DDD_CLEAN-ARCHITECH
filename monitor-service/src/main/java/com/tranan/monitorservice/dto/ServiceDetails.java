package com.tranan.monitorservice.dto;

import java.time.Instant;
import java.util.List;

/**
 * Record representing detailed information about a specific microservice.
 * Contains health status, uptime, version, current metrics, and available endpoints.
 * 
 * @param serviceName           The name of the service
 * @param status                The health status (UP, DOWN, UNKNOWN)
 * @param uptimeSeconds         The service uptime in seconds
 * @param version               The service version
 * @param currentCpu            Current CPU metrics for the service
 * @param currentMemory         Current memory metrics for the service
 * @param requestStats          Current request count statistics
 * @param responseTimeStats     Current response time statistics
 * @param endpoints             List of available API endpoints
 * @param lastUpdated           Timestamp when the details were last updated
 */
public record ServiceDetails(
    String serviceName,
    HealthStatus status,
    Long uptimeSeconds,
    String version,
    CpuMetric currentCpu,
    MemoryMetric currentMemory,
    RequestCountMetric requestStats,
    ResponseTimeMetric responseTimeStats,
    List<ServiceEndpoint> endpoints,
    Instant lastUpdated
) {
    /**
     * Compact constructor with default values.
     */
    public ServiceDetails {
        uptimeSeconds = uptimeSeconds != null ? uptimeSeconds : 0L;
        endpoints = endpoints != null ? endpoints : List.of();
    }
}
