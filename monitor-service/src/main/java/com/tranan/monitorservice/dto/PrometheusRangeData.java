package com.tranan.monitorservice.dto;

import java.util.List;

/**
 * Record representing the data portion of a Prometheus range query response.
 * Contains matrix (time-series) results with multiple data points per metric.
 * 
 * @param result     List of metrics with time-series values
 * @param resultType The type of result (should be "matrix" for range queries)
 */
public record PrometheusRangeData(
    List<PrometheusMetric> result,
    String resultType
) {
    /**
     * Compact constructor with default values.
     */
    public PrometheusRangeData {
        result = result != null ? result : List.of();
        resultType = resultType != null ? resultType : "matrix";
    }
}
