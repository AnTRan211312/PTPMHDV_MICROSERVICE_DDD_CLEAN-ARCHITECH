package com.tranan.monitorservice.dto;

import java.time.Instant;
import java.util.List;

/**
 * Record representing the aggregated dashboard summary for the monitoring system.
 * Provides an overview of all services' health and performance metrics.
 * 
 * @param totalServices          Total number of registered services
 * @param healthyServices        Number of services with UP status
 * @param unhealthyServices      Number of services with DOWN or UNKNOWN status
 * @param avgCpuUsagePercent     System-wide average CPU usage percentage (0-100)
 * @param avgMemoryUsagePercent  System-wide average memory usage percentage (0-100)
 * @param totalRequestsLastHour  Total HTTP requests across all services in the last hour
 * @param activeAlerts           List of currently active alerts
 * @param generatedAt            Timestamp when this summary was generated
 */
public record DashboardSummary(
    int totalServices,
    int healthyServices,
    int unhealthyServices,
    double avgCpuUsagePercent,
    double avgMemoryUsagePercent,
    long totalRequestsLastHour,
    List<AlertInfo> activeAlerts,
    Instant generatedAt
) {
    /**
     * Compact constructor with default value for activeAlerts.
     */
    public DashboardSummary {
        activeAlerts = activeAlerts != null ? activeAlerts : List.of();
    }
}
