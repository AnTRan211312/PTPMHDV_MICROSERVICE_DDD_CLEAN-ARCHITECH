package com.tranan.monitorservice.dto;

/**
 * Enum representing the health status of a service.
 * Used to indicate whether a service is operational, down, or in an unknown state.
 */
public enum HealthStatus {
    UP,
    DOWN,
    UNKNOWN
}
