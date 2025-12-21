package com.tranan.monitorservice.service;

import com.tranan.monitorservice.client.PrometheusClient;
import com.tranan.monitorservice.dto.AggregationType;
import com.tranan.monitorservice.dto.AlertInfo;
import com.tranan.monitorservice.dto.CpuMetric;
import com.tranan.monitorservice.dto.DashboardSummary;
import com.tranan.monitorservice.dto.MemoryMetric;
import com.tranan.monitorservice.dto.MetricsHistoryResponse;
import com.tranan.monitorservice.dto.PrometheusMetric;
import com.tranan.monitorservice.dto.PrometheusQueryRangeResult;
import com.tranan.monitorservice.dto.PrometheusQueryResult;
import com.tranan.monitorservice.dto.RequestCountMetric;
import com.tranan.monitorservice.dto.ResponseTimeMetric;
import com.tranan.monitorservice.dto.ServiceHealth;
import com.tranan.monitorservice.dto.TimeSeriesDataPoint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Default implementation of {@link MetricsService} backed by Prometheus.
 * PromQL expressions here assume Micrometer + Spring Boot 3 default metrics
 * names.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MetricsServiceImpl implements MetricsService {

    private final PrometheusClient prometheusClient;
    private final HealthService healthService;

    @Override
    public CpuMetric getCpuUsage(String serviceName) {
        // process_cpu_usage is a common Micrometer metric; multiplied by 100 for
        // percent
        String query = String.format("avg(process_cpu_usage{application=\"%s\"}) * 100", serviceName);
        Optional<PrometheusQueryResult> resultOpt = prometheusClient.query(query);

        double usage = extractSingleValue(resultOpt).orElse(0.0);
        return new CpuMetric(serviceName, usage, Instant.now());
    }

    @Override
    public MemoryMetric getMemoryUsage(String serviceName) {
        // Example using JVM memory metrics
        String usedQuery = String.format("sum(jvm_memory_used_bytes{application=\"%s\",area=\"heap\"})", serviceName);
        String maxQuery = String.format("sum(jvm_memory_max_bytes{application=\"%s\",area=\"heap\"})", serviceName);

        long used = extractSingleValue(prometheusClient.query(usedQuery))
                .map(Double::longValue)
                .orElse(0L);
        long max = extractSingleValue(prometheusClient.query(maxQuery))
                .map(Double::longValue)
                .orElse(0L);

        double percent = (max > 0) ? (used * 100.0 / max) : 0.0;
        return new MemoryMetric(serviceName, used, max, percent, Instant.now());
    }

    @Override
    public RequestCountMetric getRequestCount(String serviceName) {
        // Base metric name
        String metricName = "http_server_requests_seconds_count";

        // Construct queries with filters INSIDE the braces
        String totalQuery = String.format("sum(%s{application=\"%s\"})", metricName, serviceName);
        String successQuery = String.format("sum(%s{application=\"%s\", status=~\"2..|3..\"})", metricName,
                serviceName);
        String errorQuery = String.format("sum(%s{application=\"%s\", status=~\"4..|5..\"})", metricName, serviceName);
        String perStatusQuery = String.format("sum by (status) (%s{application=\"%s\"})", metricName, serviceName);

        long total = extractSingleValue(prometheusClient.query(totalQuery))
                .map(Double::longValue)
                .orElse(0L);
        long success = extractSingleValue(prometheusClient.query(successQuery))
                .map(Double::longValue)
                .orElse(0L);
        long error = extractSingleValue(prometheusClient.query(errorQuery))
                .map(Double::longValue)
                .orElse(0L);

        Map<Integer, Long> errorBreakdown = new HashMap<>();
        prometheusClient.query(perStatusQuery).ifPresent(r -> {
            if (r.data() != null && r.data().result() != null) {
                for (PrometheusMetric metric : r.data().result()) {
                    String status = metric.metric().get("status");
                    long value = parseVectorValue(metric.value()).map(Double::longValue).orElse(0L);
                    if (status != null) {
                        try {
                            errorBreakdown.put(Integer.parseInt(status), value);
                        } catch (NumberFormatException ignored) {
                            // ignore invalid status
                        }
                    }
                }
            }
        });

        return new RequestCountMetric(serviceName, total, success, error, errorBreakdown, Instant.now());
    }

    @Override
    public ResponseTimeMetric getResponseTime(String serviceName) {
        String baseMetric = "http_server_requests_seconds";

        // Correctly append _sum, _count, _bucket to the METRIC NAME, not after the tags
        String sumMetric = baseMetric + "_sum";
        String countMetric = baseMetric + "_count";
        String bucketMetric = baseMetric + "_bucket";

        // Average = sum(rate(sum)) / sum(rate(count))
        // We use sum() to aggregate across all instances of the service properly
        String avgQuery = String.format(
                "sum(rate(%s{application=\"%s\"}[5m])) / sum(rate(%s{application=\"%s\"}[5m])) * 1000",
                sumMetric, serviceName,
                countMetric, serviceName);

        // Percentiles using histogram_quantile
        // histogram_quantile(phi, sum(rate(bucket{...}[5m])) by (le))
        String p50Query = String.format("histogram_quantile(0.5, sum(rate(%s{application=\"%s\"}[5m])) by (le)) * 1000",
                bucketMetric, serviceName);
        String p95Query = String.format(
                "histogram_quantile(0.95, sum(rate(%s{application=\"%s\"}[5m])) by (le)) * 1000", bucketMetric,
                serviceName);
        String p99Query = String.format(
                "histogram_quantile(0.99, sum(rate(%s{application=\"%s\"}[5m])) by (le)) * 1000", bucketMetric,
                serviceName);

        double avg = extractSingleValue(prometheusClient.query(avgQuery)).orElse(0.0);
        double p50 = extractSingleValue(prometheusClient.query(p50Query)).orElse(0.0);
        double p95 = extractSingleValue(prometheusClient.query(p95Query)).orElse(0.0);
        double p99 = extractSingleValue(prometheusClient.query(p99Query)).orElse(0.0);

        return new ResponseTimeMetric(serviceName, avg, p50, p95, p99, Instant.now());
    }

    @Override
    public DashboardSummary getDashboardSummary() {
        List<String> services = healthService.getRegisteredServices();
        List<ServiceHealth> healthList = services.stream()
                .map(healthService::getServiceHealth)
                .toList();

        int total = healthList.size();
        int healthy = (int) healthList.stream()
                .filter(h -> h.status() != null && h.status().name().equalsIgnoreCase("UP"))
                .count();
        int unhealthy = total - healthy;

        double avgCpu = averageOverServices(services, this::getCpuUsage, CpuMetric::usagePercent);
        double avgMem = averageOverServices(services, this::getMemoryUsage, MemoryMetric::usagePercent);

        // total HTTP requests across all services in the last hour
        String totalRequestsQuery = "sum(increase(http_server_requests_seconds_count[1h]))";
        long totalRequests = extractSingleValue(prometheusClient.query(totalRequestsQuery))
                .map(Double::longValue)
                .orElse(0L);

        // For now, active alerts is empty; could be filled from Alertmanager later
        List<AlertInfo> alerts = Collections.emptyList();

        return new DashboardSummary(
                total,
                healthy,
                unhealthy,
                avgCpu,
                avgMem,
                totalRequests,
                alerts,
                Instant.now());
    }

    @Override
    public MetricsHistoryResponse getMetricHistory(
            String metricName,
            List<String> services,
            Instant start,
            Instant end,
            Duration step) {
        if (services == null || services.isEmpty()) {
            services = healthService.getRegisteredServices();
        }

        String promQl = buildHistoryQuery(metricName, services);
        Optional<PrometheusQueryRangeResult> resultOpt = prometheusClient.queryRange(promQl, start, end, step);

        List<TimeSeriesDataPoint> points = new ArrayList<>();
        resultOpt.ifPresent(r -> {
            if (r.data() != null && r.data().result() != null) {
                for (PrometheusMetric metric : r.data().result()) {
                    String service = metric.metric().getOrDefault("application", "unknown");
                    for (List<Object> valuePair : metric.values()) {
                        if (valuePair.size() >= 2) {
                            try {
                                double ts = Double.parseDouble(String.valueOf(valuePair.get(0)));
                                double val = Double.parseDouble(String.valueOf(valuePair.get(1)));
                                points.add(new TimeSeriesDataPoint(
                                        Instant.ofEpochSecond((long) ts),
                                        val,
                                        service,
                                        metricName));
                            } catch (NumberFormatException ignored) {
                                // skip invalid points
                            }
                        }
                    }
                }
            }
        });

        return new MetricsHistoryResponse(
                metricName,
                services,
                start,
                end,
                step,
                AggregationType.AVG,
                points.stream()
                        .sorted((a, b) -> a.timestamp().compareTo(b.timestamp()))
                        .collect(Collectors.toList()),
                points.size());
    }

    private Optional<Double> extractSingleValue(Optional<PrometheusQueryResult> resultOpt) {
        if (resultOpt.isEmpty() || resultOpt.get().data() == null) {
            return Optional.empty();
        }
        List<PrometheusMetric> result = resultOpt.get().data().result();
        if (result == null || result.isEmpty()) {
            return Optional.empty();
        }
        return parseVectorValue(result.get(0).value());
    }

    private Optional<Double> parseVectorValue(List<Object> value) {
        if (value == null || value.size() < 2) {
            return Optional.empty();
        }
        try {
            return Optional.of(Double.parseDouble(String.valueOf(value.get(1))));
        } catch (NumberFormatException ex) {
            log.warn("Failed to parse Prometheus value: {}", value, ex);
            return Optional.empty();
        }
    }

    private <T> double averageOverServices(
            List<String> services,
            java.util.function.Function<String, T> supplier,
            java.util.function.ToDoubleFunction<T> extractor) {
        if (services == null || services.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        int count = 0;
        for (String s : services) {
            try {
                T metric = supplier.apply(s);
                sum += extractor.applyAsDouble(metric);
                count++;
            } catch (Exception ex) {
                log.debug("Failed to fetch metric for service {}: {}", s, ex.getMessage());
            }
        }
        return count > 0 ? sum / count : 0.0;
    }

    private String buildHistoryQuery(String metricName, List<String> services) {
        String serviceRegex = services.stream()
                .map(s -> s.replace("\"", ""))
                .collect(Collectors.joining("|"));

        // Very simple mapping metricName -> PromQL
        return switch (metricName) {
            case "cpu" -> String.format(
                    "avg(process_cpu_usage{application=~\"%s\"}) * 100",
                    serviceRegex);
            case "memory" -> String.format(
                    "sum(jvm_memory_used_bytes{application=~\"%s\",area=\"heap\"})",
                    serviceRegex);
            case "requests" -> String.format(
                    "sum(rate(http_server_requests_seconds_count{application=~\"%s\"}[1m]))",
                    serviceRegex);
            case "responseTime" -> String.format(
                    "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{application=~\"%s\"}[1m])) by (le,application)) * 1000",
                    serviceRegex);
            default -> metricName; // assume caller passes full promQL
        };
    }
}
