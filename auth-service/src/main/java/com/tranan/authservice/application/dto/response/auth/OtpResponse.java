package com.tranan.authservice.application.dto.response.auth;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpResponse {
    private boolean success;
    private String message;
    private Long expiresIn; // Thời gian hết hạn tính bằng giây (300s = 5 phút)
    private Integer remainingAttempts; // Số lần gửi còn lại
}
