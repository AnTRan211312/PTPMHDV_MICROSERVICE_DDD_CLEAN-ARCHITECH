package com.tranan.monitorservice.controller;

import com.tranan.monitorservice.annotation.ApiMessage;
import com.tranan.monitorservice.dto.CpuMetric;
import com.tranan.monitorservice.dto.DashboardSummary;
import com.tranan.monitorservice.dto.MemoryMetric;
import com.tranan.monitorservice.dto.MetricsHistoryResponse;
import com.tranan.monitorservice.dto.RequestCountMetric;
import com.tranan.monitorservice.dto.ResponseTimeMetric;
import com.tranan.monitorservice.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * REST controller exposing metrics and dashboard data backed by Prometheus.
 */
@RestController
@RequestMapping("/api/monitor/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsService metricsService;

    @GetMapping("/dashboard")
    @ApiMessage("Fetched dashboard summary")
    @PreAuthorize("hasAuthority('GET /api/monitor/metrics/dashboard')")
    public ResponseEntity<DashboardSummary> getDashboardSummary() {
        return ResponseEntity.ok(metricsService.getDashboardSummary());
    }

    @GetMapping("/cpu/{serviceName}")
    @ApiMessage("Fetched CPU usage")
    @PreAuthorize("hasAuthority('GET /api/monitor/metrics/cpu/{serviceName}')")
    public ResponseEntity<CpuMetric> getCpuUsage(@PathVariable String serviceName) {
        return ResponseEntity.ok(metricsService.getCpuUsage(serviceName));
    }

    @GetMapping("/memory/{serviceName}")
    @ApiMessage("Fetched memory usage")
    @PreAuthorize("hasAuthority('GET /api/monitor/metrics/memory/{serviceName}')")
    public ResponseEntity<MemoryMetric> getMemoryUsage(@PathVariable String serviceName) {
        return ResponseEntity.ok(metricsService.getMemoryUsage(serviceName));
    }

    @GetMapping("/requests/{serviceName}")
    @ApiMessage("Fetched request statistics")
    @PreAuthorize("hasAuthority('GET /api/monitor/metrics/requests/{serviceName}')")
    public ResponseEntity<RequestCountMetric> getRequestCount(@PathVariable String serviceName) {
        return ResponseEntity.ok(metricsService.getRequestCount(serviceName));
    }

    @GetMapping("/response-time/{serviceName}")
    @ApiMessage("Fetched response time statistics")
    @PreAuthorize("hasAuthority('GET /api/monitor/metrics/response-time/{serviceName}')")
    public ResponseEntity<ResponseTimeMetric> getResponseTime(@PathVariable String serviceName) {
        return ResponseEntity.ok(metricsService.getResponseTime(serviceName));
    }

    @GetMapping("/history")
    @ApiMessage("Fetched metrics history")
    @PreAuthorize("hasAuthority('GET /api/monitor/metrics/history')")
    public ResponseEntity<MetricsHistoryResponse> getMetricHistory(
            @RequestParam String metricName,
            @RequestParam(required = false) List<String> services,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            @RequestParam(defaultValue = "60") long stepSeconds) {
        Duration step = Duration.ofSeconds(stepSeconds);
        return ResponseEntity.ok(metricsService.getMetricHistory(metricName, services, start, end, step));
    }
}
