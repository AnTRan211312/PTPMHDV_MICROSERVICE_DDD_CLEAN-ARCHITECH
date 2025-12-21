package com.tranan.monitorservice.dto;

import java.util.List;

/**
 * Record representing the data portion of a Prometheus query response.
 * Contains either instant vector results or range vector results.
 * 
 * @param result       List of instant vector results (for instant queries)
 * @param resultType   The type of result (vector, matrix, scalar, string)
 */
public record PrometheusData(
    List<PrometheusMetric> result,
    String resultType
) {
    /**
     * Compact constructor with default values.
     */
    public PrometheusData {
        result = result != null ? result : List.of();
        resultType = resultType != null ? resultType : "vector";
    }
}
