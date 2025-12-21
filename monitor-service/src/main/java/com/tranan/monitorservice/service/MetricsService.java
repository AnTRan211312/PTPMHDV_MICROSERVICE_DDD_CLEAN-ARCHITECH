package com.tranan.monitorservice.service;

import com.tranan.monitorservice.dto.CpuMetric;
import com.tranan.monitorservice.dto.DashboardSummary;
import com.tranan.monitorservice.dto.MemoryMetric;
import com.tranan.monitorservice.dto.MetricsHistoryResponse;
import com.tranan.monitorservice.dto.RequestCountMetric;
import com.tranan.monitorservice.dto.ResponseTimeMetric;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Service for querying metrics from Prometheus and aggregating them
 * into DTOs used by the monitoring dashboard.
 */
public interface MetricsService {

    CpuMetric getCpuUsage(String serviceName);

    MemoryMetric getMemoryUsage(String serviceName);

    RequestCountMetric getRequestCount(String serviceName);

    ResponseTimeMetric getResponseTime(String serviceName);

    DashboardSummary getDashboardSummary();

    MetricsHistoryResponse getMetricHistory(
            String metricName,
            List<String> services,
            Instant start,
            Instant end,
            Duration step
    );
}


