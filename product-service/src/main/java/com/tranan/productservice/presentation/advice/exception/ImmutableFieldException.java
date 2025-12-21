package com.tranan.productservice.presentation.advice.exception;

public class ImmutableFieldException extends RuntimeException {
    public ImmutableFieldException(String message) {
        super(message);
    }
}
