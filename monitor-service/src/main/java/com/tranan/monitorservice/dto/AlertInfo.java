package com.tranan.monitorservice.dto;

import java.time.Instant;

/**
 * Record representing an active alert in the monitoring system.
 * Contains information about alerts triggered by service issues.
 * 
 * @param serviceName  The name of the service that triggered the alert
 * @param alertType    The type of alert (e.g., HIGH_CPU, HIGH_MEMORY, SERVICE_DOWN)
 * @param message      Human-readable description of the alert
 * @param triggeredAt  Timestamp when the alert was triggered
 */
public record AlertInfo(
    String serviceName,
    String alertType,
    String message,
    Instant triggeredAt
) {}
