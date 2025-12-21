package com.tranan.monitorservice.dto;

/**
 * Record representing an API endpoint of a microservice.
 * Contains information about the HTTP method, path, and description.
 * 
 * @param method      The HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param path        The endpoint path
 * @param description A brief description of what the endpoint does
 */
public record ServiceEndpoint(
    String method,
    String path,
    String description
) {
}
