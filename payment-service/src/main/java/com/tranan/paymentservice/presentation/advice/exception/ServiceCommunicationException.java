package com.tranan.paymentservice.presentation.advice.exception;

public class ServiceCommunicationException extends RuntimeException {
    public ServiceCommunicationException(String serviceName, String details) {
        super(String.format("Failed to communicate with %s: %s", serviceName, details));
    }
}
