package com.tranan.monitorservice.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private int code;
    private String message;
    private T data;

    public ApiResponse(int code, String message, T data, boolean _ignored) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(String message, String errorCode) {
        this.code = 0;
        this.message = message;
        this.data = null;
    }

    public ApiResponse(String message, int code) {
        this.code = code;
        this.message = message;
        this.data = null;
    }

    public ApiResponse(String message, T data) {
        this.code = 200;
        this.message = message;
        this.data = data;
    }
}
