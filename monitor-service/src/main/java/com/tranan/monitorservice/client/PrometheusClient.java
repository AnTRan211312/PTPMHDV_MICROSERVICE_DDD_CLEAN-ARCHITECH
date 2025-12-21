package com.tranan.monitorservice.client;

import com.tranan.monitorservice.dto.PrometheusQueryResult;
import com.tranan.monitorservice.dto.PrometheusQueryRangeResult;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Client interface for querying Prometheus metrics.
 * Provides methods to execute instant queries and range queries against Prometheus.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.1
 */
public interface PrometheusClient {

    /**
     * Execute an instant query against Prometheus.
     * Returns the current value of metrics matching the PromQL expression.
     * 
     * @param promQL The PromQL query string (e.g., "process_cpu_usage * 100")
     * @return Optional containing the query result if successful, empty if query fails
     * 
     * Validates: Requirements 2.1, 2.2, 2.3, 2.4
     */
    Optional<PrometheusQueryResult> query(String promQL);

    /**
     * Execute a range query against Prometheus.
     * Returns time-series data points for metrics matching the PromQL expression
     * over the specified time range.
     * 
     * @param promQL The PromQL query string
     * @param start  The start time of the range (inclusive)
     * @param end    The end time of the range (inclusive)
     * @param step   The query resolution step (minimum 15 seconds recommended)
     * @return Optional containing the query result if successful, empty if query fails
     * 
     * Validates: Requirements 4.1
     */
    Optional<PrometheusQueryRangeResult> queryRange(String promQL, Instant start, Instant end, Duration step);
}
