package com.tranan.inventoryservice.presentation.advice.exception;


public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}