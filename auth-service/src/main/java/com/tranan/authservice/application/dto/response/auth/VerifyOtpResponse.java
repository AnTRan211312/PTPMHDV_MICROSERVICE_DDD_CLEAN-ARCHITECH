package com.tranan.authservice.application.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpResponse {
    private boolean success;
    private String message;
    private boolean isValid; // OTP có hợp lệ không
}
