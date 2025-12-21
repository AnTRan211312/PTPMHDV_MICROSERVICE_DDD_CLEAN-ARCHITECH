package com.tranan.monitorservice.exception;

/**
 * Exception thrown when a requested service is not found in Eureka registry.
 */
public class ServiceNotFoundException extends RuntimeException {
    
    public ServiceNotFoundException(String serviceName) {
        super("Service not found: " + serviceName);
    }

    public ServiceNotFoundException(String serviceName, Throwable cause) {
        super("Service not found: " + serviceName, cause);
    }
}
