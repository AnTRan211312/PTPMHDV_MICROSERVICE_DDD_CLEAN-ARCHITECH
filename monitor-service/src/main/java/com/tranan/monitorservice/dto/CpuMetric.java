package com.tranan.monitorservice.dto;

import java.time.Instant;

/**
 * Record representing CPU usage metrics for a microservice.
 * Contains information about CPU utilization percentage.
 * 
 * @param serviceName   The name of the service
 * @param usagePercent  CPU usage percentage (0-100)
 * @param timestamp     Timestamp when the metric was collected
 */
public record CpuMetric(
    String serviceName,
    double usagePercent,
    Instant timestamp
) {
    /**
     * Compact constructor ensuring usagePercent is non-negative.
     */
    public CpuMetric {
        usagePercent = usagePercent >= 0 ? usagePercent : 0.0;
    }
}
