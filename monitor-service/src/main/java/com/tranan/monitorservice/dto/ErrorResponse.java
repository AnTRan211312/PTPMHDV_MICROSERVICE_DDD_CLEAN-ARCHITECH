package com.tranan.monitorservice.dto;

import java.time.Instant;

/**
 * Record representing an error response from the Monitor Service API.
 * Contains error details including HTTP status, error type, message, and trace information.
 * 
 * @param status    The HTTP status code
 * @param error     The error type/category
 * @param message   The error message describing what went wrong
 * @param timestamp The timestamp when the error occurred
 * @param path      The API path that caused the error
 * @param traceId   The unique trace ID for debugging and correlation
 */
public record ErrorResponse(
    int status,
    String error,
    String message,
    Instant timestamp,
    String path,
    String traceId
) {
    /**
     * Compact constructor with validation.
     */
    public ErrorResponse {
        if (status < 100 || status >= 600) {
            throw new IllegalArgumentException("Invalid HTTP status code: " + status);
        }
        if (error == null || error.isBlank()) {
            throw new IllegalArgumentException("Error type cannot be null or blank");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Error message cannot be null or blank");
        }
        if (timestamp == null) {
            throw new IllegalArgumentException("Timestamp cannot be null");
        }
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Path cannot be null or blank");
        }
        if (traceId == null || traceId.isBlank()) {
            throw new IllegalArgumentException("TraceId cannot be null or blank");
        }
    }
}
