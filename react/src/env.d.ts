/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables
 * @see https://vite.dev/guide/env-and-mode.html#intellisense-for-typescript
 */
interface ImportMetaEnv {
    /** API Gateway base URL (e.g., http://localhost:8080/api) */
    readonly VITE_API_BASE_URL: string;

    /** Prometheus metrics URL */
    readonly VITE_PROMETHEUS_URL: string;

    /** Grafana dashboard URL */
    readonly VITE_GRAFANA_URL: string;

    /** Eureka service registry URL */
    readonly VITE_EUREKA_URL: string;

    /** Kafka UI URL */
    readonly VITE_KAFKA_UI_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
