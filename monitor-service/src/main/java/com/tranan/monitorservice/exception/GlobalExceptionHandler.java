package com.tranan.monitorservice.exception;

import com.tranan.monitorservice.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.UUID;

/**
 * Global exception handler for the Monitor Service API.
 * Converts exceptions to a standardized {@link ErrorResponse}.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ServiceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleServiceNotFound(ServiceNotFoundException ex, WebRequest request) {
        return buildErrorResponse(ex, HttpStatus.NOT_FOUND, request, "SERVICE_NOT_FOUND");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        return buildErrorResponse(ex, HttpStatus.INTERNAL_SERVER_ERROR, request, "INTERNAL_SERVER_ERROR");
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            Exception ex,
            HttpStatus status,
            WebRequest request,
            String errorType
    ) {
        String path = "";
        if (request instanceof ServletWebRequest servletWebRequest) {
            path = servletWebRequest.getRequest().getRequestURI();
        }

        String traceId = UUID.randomUUID().toString();
        log.error("Error occurred [traceId={}]: {}", traceId, ex.getMessage(), ex);

        ErrorResponse body = new ErrorResponse(
                status.value(),
                errorType,
                ex.getMessage(),
                Instant.now(),
                path,
                traceId
        );

        return ResponseEntity.status(status).body(body);
    }
}


