package com.tranan.monitorservice.dto;

import java.time.Instant;

/**
 * Record representing a single data point in a time-series metrics response.
 * Used for displaying metrics history charts on the dashboard.
 * 
 * @param timestamp    The timestamp of the data point
 * @param value        The metric value at this timestamp
 * @param serviceName  The name of the service this data point belongs to
 * @param metricName   The name of the metric being measured
 */
public record TimeSeriesDataPoint(
    Instant timestamp,
    double value,
    String serviceName,
    String metricName
) {}
