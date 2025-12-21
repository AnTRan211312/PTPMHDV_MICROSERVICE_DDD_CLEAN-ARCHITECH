package com.tranan.monitorservice.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Record representing HTTP request count metrics for a microservice.
 * Contains information about total, successful, and error requests.
 * 
 * @param serviceName     The name of the service
 * @param totalRequests   Total number of HTTP requests
 * @param successRequests Number of successful requests (2xx, 3xx)
 * @param errorRequests   Number of error requests (4xx, 5xx)
 * @param errorBreakdown  Breakdown of errors by HTTP status code
 * @param timestamp       Timestamp when the metric was collected
 */
public record RequestCountMetric(
    String serviceName,
    long totalRequests,
    long successRequests,
    long errorRequests,
    Map<Integer, Long> errorBreakdown,
    Instant timestamp
) {
    /**
     * Compact constructor ensuring all values are non-negative and errorBreakdown is not null.
     */
    public RequestCountMetric {
        totalRequests = totalRequests >= 0 ? totalRequests : 0L;
        successRequests = successRequests >= 0 ? successRequests : 0L;
        errorRequests = errorRequests >= 0 ? errorRequests : 0L;
        errorBreakdown = errorBreakdown != null ? errorBreakdown : Map.of();
    }
}
