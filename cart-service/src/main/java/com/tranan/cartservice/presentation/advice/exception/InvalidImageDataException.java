package com.tranan.cartservice.presentation.advice.exception;



public class InvalidImageDataException extends ImmutableFieldException {
    public InvalidImageDataException(String message) {
        super(message);
    }
}
