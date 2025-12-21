import type { PageResponseDto } from "@/types/apiResponse";

export interface AlertInfo {
    serviceName: string;
    alertType: string;
    message: string;
    triggeredAt: string;
}

export interface DashboardSummary {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    avgCpuUsagePercent: number;
    avgMemoryUsagePercent: number;
    totalRequestsLastHour: number;
    activeAlerts: AlertInfo[];
    generatedAt: string;
}

export interface CpuMetric {
    serviceName: string;
    usagePercent: number;
    timestamp: string;
}

export interface MemoryMetric {
    serviceName: string;
    usedBytes: number;
    maxBytes: number;
    usagePercent: number;
    timestamp: string;
}

export interface RequestCountMetric {
    serviceName: string;
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    errorBreakdown: Record<number, number>;
    timestamp: string;
}

export interface ResponseTimeMetric {
    serviceName: string;
    avgResponseTimeMs: number;
    p50ResponseTimeMs: number;
    p95ResponseTimeMs: number;
    p99ResponseTimeMs: number;
    timestamp: string;
}

export interface TimeSeriesDataPoint {
    timestamp: string;
    value: number;
    serviceName: string;
    metricName: string;
}

export type AggregationType = "AVG" | "SUM" | "MAX" | "MIN" | "COUNT";

export interface MetricsHistoryResponse {
    metricName: string;
    services: string[];
    start: string;
    end: string;
    step: string; // Duration string
    aggregationType: AggregationType;
    dataPoints: TimeSeriesDataPoint[];
    totalPoints: number;
}

export type HealthStatus = "UP" | "DOWN" | "UNKNOWN";

export interface ServiceHealth {
    serviceName: string;
    status: HealthStatus;
    lastChecked: string;
    instanceId: string;
    uptimeSeconds: number;
    details: Record<string, any>;
}

export type ServiceHealthPageResponse = PageResponseDto<ServiceHealth>;
