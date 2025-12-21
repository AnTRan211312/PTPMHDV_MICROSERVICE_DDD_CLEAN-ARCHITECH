package com.tranan.monitorservice.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Record representing the health status of a microservice.
 * Contains information about service availability, uptime, and additional details.
 * 
 * @param serviceName  The name of the service
 * @param status       The health status (UP, DOWN, UNKNOWN)
 * @param lastChecked  Timestamp of the last health check
 * @param instanceId   The unique instance identifier
 * @param uptimeSeconds The service uptime in seconds
 * @param details      Additional health check details
 */
public record ServiceHealth(
    String serviceName,
    HealthStatus status,
    Instant lastChecked,
    String instanceId,
    Long uptimeSeconds,
    Map<String, Object> details
) {
    /**
     * Compact constructor with default value for uptimeSeconds.
     */
    public ServiceHealth {
        uptimeSeconds = uptimeSeconds != null ? uptimeSeconds : 0L;
    }
}
