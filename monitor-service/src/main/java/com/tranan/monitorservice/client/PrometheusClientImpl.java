package com.tranan.monitorservice.client;

import com.tranan.monitorservice.dto.PrometheusQueryRangeResult;
import com.tranan.monitorservice.dto.PrometheusQueryResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Default implementation of {@link PrometheusClient} using
 * {@link RestTemplate}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrometheusClientImpl implements PrometheusClient {

    private final RestTemplate restTemplate;

    @Value("${prometheus.url}")
    private String prometheusBaseUrl;

    @Override
    public Optional<PrometheusQueryResult> query(String promQL) {
        try {
            String url = prometheusBaseUrl + "/api/v1/query?query={query}";
            log.debug("Executing Prometheus instant query: {} [query={}]", url, promQL);
            PrometheusQueryResult result = restTemplate.getForObject(url, PrometheusQueryResult.class, promQL);
            return Optional.ofNullable(result);
        } catch (RestClientException ex) {
            log.warn("Prometheus instant query failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<PrometheusQueryRangeResult> queryRange(String promQL, Instant start, Instant end, Duration step) {
        try {
            long stepSeconds = Math.max(step.getSeconds(), 1);
            String url = prometheusBaseUrl + "/api/v1/query_range?query={query}&start={start}&end={end}&step={step}";

            log.debug("Executing Prometheus range query: {} [query={}, start={}, end={}, step={}]",
                    url, promQL, start.getEpochSecond(), end.getEpochSecond(), stepSeconds);

            PrometheusQueryRangeResult result = restTemplate.getForObject(
                    url,
                    PrometheusQueryRangeResult.class,
                    promQL,
                    start.getEpochSecond(),
                    end.getEpochSecond(),
                    stepSeconds);
            return Optional.ofNullable(result);
        } catch (RestClientException ex) {
            log.warn("Prometheus range query failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
