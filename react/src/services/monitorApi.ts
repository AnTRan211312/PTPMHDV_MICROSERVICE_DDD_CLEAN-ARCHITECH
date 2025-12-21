import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/apiResponse";
import type {
    DashboardSummary,
    CpuMetric,
    MemoryMetric,
    RequestCountMetric,
    ResponseTimeMetric,
    MetricsHistoryResponse,
    ServiceHealth,
    ServiceHealthPageResponse
} from "@/types/monitor";

// Metrics API
export const getDashboardSummary = () => {
    return axiosClient.get<ApiResponse<DashboardSummary>>("/monitor/metrics/dashboard");
};

export const getCpuUsage = (serviceName: string) => {
    return axiosClient.get<ApiResponse<CpuMetric>>(`/monitor/metrics/cpu/${serviceName}`);
};

export const getMemoryUsage = (serviceName: string) => {
    return axiosClient.get<ApiResponse<MemoryMetric>>(`/monitor/metrics/memory/${serviceName}`);
};

export const getRequestCount = (serviceName: string) => {
    return axiosClient.get<ApiResponse<RequestCountMetric>>(`/monitor/metrics/requests/${serviceName}`);
};

export const getResponseTime = (serviceName: string) => {
    return axiosClient.get<ApiResponse<ResponseTimeMetric>>(`/monitor/metrics/response-time/${serviceName}`);
};

export const getMetricHistory = (
    metricName: string,
    services?: string[],
    start?: string,
    end?: string,
    stepSeconds: number = 60
) => {
    const params = new URLSearchParams();
    params.append("metricName", metricName);
    if (services && services.length > 0) {
        services.forEach(s => params.append("services", s));
    }
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    params.append("stepSeconds", stepSeconds.toString());

    return axiosClient.get<ApiResponse<MetricsHistoryResponse>>(`/monitor/metrics/history?${params.toString()}`);
};

// Health API
export const getAllServicesHealth = (page: number, size: number) => {
    return axiosClient.get<ApiResponse<ServiceHealthPageResponse>>(`/monitor/health/services?page=${page}&size=${size}`);
};

export const getServiceHealth = (serviceName: string) => {
    return axiosClient.get<ApiResponse<ServiceHealth>>(`/monitor/health/services/${serviceName}`);
};

export const getRegisteredServices = () => {
    return axiosClient.get<ApiResponse<string[]>>("/monitor/health/services/registered");
};
