package com.tranan.monitorservice.dto;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Record representing the response for metrics history queries.
 * Contains time-series data points for displaying charts on the dashboard.
 * 
 * @param metricName       The name of the metric being queried
 * @param services         List of service names included in the response
 * @param start            Start timestamp of the query range
 * @param end              End timestamp of the query range
 * @param step             Time interval between data points
 * @param aggregationType  The type of aggregation applied to the data
 * @param dataPoints       List of time-series data points
 * @param totalPoints      Total number of data points in the response
 */
public record MetricsHistoryResponse(
    String metricName,
    List<String> services,
    Instant start,
    Instant end,
    Duration step,
    AggregationType aggregationType,
    List<TimeSeriesDataPoint> dataPoints,
    int totalPoints
) {}
