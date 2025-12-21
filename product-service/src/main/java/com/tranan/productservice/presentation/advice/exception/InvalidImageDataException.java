package com.tranan.productservice.presentation.advice.exception;


public class InvalidImageDataException extends ImmutableFieldException {
    public InvalidImageDataException(String message) {
        super(message);
    }
}
