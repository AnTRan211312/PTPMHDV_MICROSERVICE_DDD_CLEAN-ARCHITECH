package com.tranan.monitorservice.dto;

/**
 * Enum representing the type of aggregation to apply to metrics data.
 * Used for time-series data aggregation in metrics history queries.
 */
public enum AggregationType {
    AVG,
    SUM,
    MIN,
    MAX
}
