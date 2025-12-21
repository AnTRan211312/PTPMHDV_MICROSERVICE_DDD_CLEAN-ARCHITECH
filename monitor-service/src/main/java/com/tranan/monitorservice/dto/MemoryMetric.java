package com.tranan.monitorservice.dto;

import java.time.Instant;

/**
 * Record representing memory usage metrics for a microservice.
 * Contains information about heap memory utilization.
 * 
 * @param serviceName   The name of the service
 * @param usedBytes     Memory used in bytes
 * @param maxBytes      Maximum memory available in bytes
 * @param usagePercent  Memory usage percentage (0-100)
 * @param timestamp     Timestamp when the metric was collected
 */
public record MemoryMetric(
    String serviceName,
    long usedBytes,
    long maxBytes,
    double usagePercent,
    Instant timestamp
) {
    /**
     * Compact constructor ensuring all values are non-negative.
     */
    public MemoryMetric {
        usedBytes = usedBytes >= 0 ? usedBytes : 0L;
        maxBytes = maxBytes >= 0 ? maxBytes : 0L;
        usagePercent = usagePercent >= 0 ? usagePercent : 0.0;
    }
}
