package com.tranan.monitorservice.dto;

import java.time.Instant;

/**
 * Record representing response time metrics for a microservice.
 * Contains average and percentile response times in milliseconds.
 * 
 * @param serviceName        The name of the service
 * @param avgResponseTimeMs  Average response time in milliseconds
 * @param p50ResponseTimeMs  50th percentile (median) response time in milliseconds
 * @param p95ResponseTimeMs  95th percentile response time in milliseconds
 * @param p99ResponseTimeMs  99th percentile response time in milliseconds
 * @param timestamp          Timestamp when the metric was collected
 */
public record ResponseTimeMetric(
    String serviceName,
    double avgResponseTimeMs,
    double p50ResponseTimeMs,
    double p95ResponseTimeMs,
    double p99ResponseTimeMs,
    Instant timestamp
) {
    /**
     * Compact constructor ensuring all values are non-negative.
     */
    public ResponseTimeMetric {
        avgResponseTimeMs = avgResponseTimeMs >= 0 ? avgResponseTimeMs : 0.0;
        p50ResponseTimeMs = p50ResponseTimeMs >= 0 ? p50ResponseTimeMs : 0.0;
        p95ResponseTimeMs = p95ResponseTimeMs >= 0 ? p95ResponseTimeMs : 0.0;
        p99ResponseTimeMs = p99ResponseTimeMs >= 0 ? p99ResponseTimeMs : 0.0;
    }
}
