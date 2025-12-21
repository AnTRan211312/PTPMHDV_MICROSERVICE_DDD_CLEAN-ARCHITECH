package com.tranan.monitorservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * Record representing a single metric from a Prometheus query result.
 * Contains metric labels and the value(s).
 * 
 * @param metric The metric labels as key-value pairs (e.g., job, instance, handler)
 * @param value  The metric value as [timestamp, value] pair for instant queries
 * @param values List of [timestamp, value] pairs for range queries
 */
public record PrometheusMetric(
    Map<String, String> metric,
    List<Object> value,
    List<List<Object>> values
) {
    /**
     * Compact constructor with default values.
     */
    public PrometheusMetric {
        metric = metric != null ? metric : Map.of();
        value = value != null ? value : List.of();
        values = values != null ? values : List.of();
    }
}
