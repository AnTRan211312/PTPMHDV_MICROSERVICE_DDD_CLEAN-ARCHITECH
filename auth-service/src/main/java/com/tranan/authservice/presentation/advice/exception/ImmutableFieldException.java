package com.tranan.authservice.presentation.advice.exception;

public class ImmutableFieldException extends RuntimeException {
    public ImmutableFieldException(String message) {
        super(message);
    }
}
