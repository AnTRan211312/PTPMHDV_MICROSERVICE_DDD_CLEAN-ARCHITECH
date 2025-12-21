package com.tranan.monitorservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Record representing the response from a Prometheus instant query (/api/v1/query).
 * Contains the status of the query and the result data.
 * 
 * @param status The status of the query (success, error)
 * @param data   The query result data containing metrics
 * @param error  Error message if status is error
 */
public record PrometheusQueryResult(
    String status,
    PrometheusData data,
    String error
) {
    /**
     * Compact constructor with default values.
     */
    public PrometheusQueryResult {
        status = status != null ? status : "success";
        data = data != null ? data : new PrometheusData(List.of(), "vector");
    }
}
