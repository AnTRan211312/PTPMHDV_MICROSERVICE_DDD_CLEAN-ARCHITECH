package com.tranan.monitorservice.dto;

import java.util.List;

/**
 * Record representing the response from a Prometheus range query (/api/v1/query_range).
 * Contains the status of the query and the result data with time-series values.
 * 
 * @param status The status of the query (success, error)
 * @param data   The query result data containing time-series metrics
 * @param error  Error message if status is error
 */
public record PrometheusQueryRangeResult(
    String status,
    PrometheusRangeData data,
    String error
) {
    /**
     * Compact constructor with default values.
     */
    public PrometheusQueryRangeResult {
        status = status != null ? status : "success";
        data = data != null ? data : new PrometheusRangeData(List.of(), "matrix");
    }
}
