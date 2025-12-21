package com.tranan.authservice.infrastructure.config.network;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpRedisService {

    private final RedisTemplate<String, String> redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom(); // Reuse instance

    private static final String OTP_PREFIX = "otp:";
    private static final String RATE_LIMIT_PREFIX = "otp_rate_limit:";
    private static final Duration OTP_EXPIRATION = Duration.ofMinutes(5);
    private static final Duration RATE_LIMIT_DURATION = Duration.ofMinutes(15);
    private static final int MAX_ATTEMPTS = 3;
    private static final String VALIDATION_ATTEMPTS_PREFIX = "otp_attempts:"; // Prefix mới
    private static final int MAX_VALIDATION_ATTEMPTS = 5;

    // ========================================================================
    // 1. GENERATION METHODS (TẠO OTP)
    // ========================================================================

    /**
     * Tạo OTP mới (Có kiểm tra trùng). Dùng cho lần gửi đầu tiên.
     */
    public String generateOtpWithValidation(String email) {
        if (isOtpExist(email)) {
            throw new IllegalArgumentException("Mã OTP trước đó vẫn còn hiệu lực. Vui lòng đợi 5 phút.");
        }
        return generateAndSaveOtp(email);
    }
    // [MỚI] Hàm này dùng để trả về cho FE biết còn bao nhiêu lần nhập
    public int getRemainingValidationAttempts(String email) {
        String key = VALIDATION_ATTEMPTS_PREFIX + email;
        String usedStr = redisTemplate.opsForValue().get(key);
        int used = (usedStr == null) ? 0 : Integer.parseInt(usedStr);

        return Math.max(0, MAX_VALIDATION_ATTEMPTS - used);
    }


    /**
     * Gửi lại OTP (Xóa cũ tạo mới). Dùng cho nút "Resend".
     */
    public String regenerateOtp(String email) {
        // Không cần check tồn tại, xóa luôn cái cũ (nếu có)
        deleteOtp(email);
        return generateAndSaveOtp(email);
    }

    // --- Private Shared Logic: Core của việc sinh OTP ---
    private String generateAndSaveOtp(String email) {
        // 1. Check Rate Limit (Logic chung cho cả tạo mới và gửi lại)
        if (!canSendOtp(email)) {
            int attempts = getSendAttempts(email);
            throw new IllegalArgumentException("Bạn đã gửi OTP quá " + attempts + " lần. Thử lại sau 15 phút.");
        }
        String otp = String.valueOf(secureRandom.nextInt(900000) + 100000);
        redisTemplate.opsForValue().set(getOtpKey(email), otp, OTP_EXPIRATION);

        // [MỚI] 3. Khởi tạo số lần nhập sai = 0
        String validationKey = VALIDATION_ATTEMPTS_PREFIX + email;
        redisTemplate.delete(validationKey); // Xóa lượt đếm


        // 3. Tăng đếm
        incrementSendAttempt(email);

        return otp;
    }

    // ========================================================================
    // 2. VALIDATION METHODS (XÁC THỰC)
    // ========================================================================

    /**
     * Chỉ kiểm tra đúng sai, KHÔNG xóa. (Dùng cho UI check tick xanh)
     */
    public boolean checkOtp(String email, String otpInput) {
        String storedOtp = redisTemplate.opsForValue().get(getOtpKey(email));
        return storedOtp != null && storedOtp.equals(otpInput);
    }

    /**
     * Kiểm tra và Xóa nếu đúng. (Return boolean)
     */
    public boolean verifyOtp(String email, String otpInput) {
        String otpKey = getOtpKey(email);
        String validationKey = VALIDATION_ATTEMPTS_PREFIX + email;
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        // 1. Nếu không có OTP hoặc hết hạn
        if (storedOtp == null) {
            return false;
        }

        // 2. Kiểm tra xem còn lượt nhập không
        int remaining = getRemainingValidationAttempts(email);
        if (remaining <= 0) {
            deleteOtp(email); // Xóa luôn OTP nếu nhập sai quá nhiều
            throw new IllegalArgumentException("Bạn đã nhập sai quá số lần quy định. Vui lòng gửi lại mã mới.");
        }

        // 3. So khớp
        if (storedOtp.equals(otpInput)) {
            deleteOtp(email); // Đúng thì xóa OTP
            redisTemplate.delete(validationKey); // Xóa luôn biến đếm
            return true;
        } else {
            // [MỚI] Nếu SAI -> Tăng biến đếm nhập sai
            redisTemplate.opsForValue().increment(validationKey);
            redisTemplate.expire(validationKey, OTP_EXPIRATION); // Set thời gian sống theo OTP
            return false;
        }
    }

    /**
     * Kiểm tra và Xóa nếu đúng. (Throw Exception nếu sai)
     * Dùng cho API Reset Password (Critical Action)
     */
    public void validateAndConsumeOtp(String email, String otpInput) {
        if (!checkOtp(email, otpInput)) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }
        deleteOtp(email);
    }

    // ========================================================================
    // 3. HELPER & RATE LIMIT (UTILS)
    // ========================================================================

    public void deleteOtp(String email) {
        redisTemplate.delete(getOtpKey(email));
    }

    private boolean isOtpExist(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(getOtpKey(email)));
    }

    public boolean canSendOtp(String email) {
        return getSendAttempts(email) < MAX_ATTEMPTS;
    }

    public int getSendAttempts(String email) {
        String attemptsStr = redisTemplate.opsForValue().get(getRateLimitKey(email));
        return (attemptsStr == null) ? 0 : Integer.parseInt(attemptsStr);
    }

    public int getRemainingAttempts(String email) {
        return Math.max(0, MAX_ATTEMPTS - getSendAttempts(email));
    }

    private void incrementSendAttempt(String email) {
        String key = getRateLimitKey(email);
        Long count = redisTemplate.opsForValue().increment(key);
        // Nếu là lần đầu tiên (count == 1), set thời gian hết hạn cho key rate limit
        if (count != null && count == 1) {
            redisTemplate.expire(key, RATE_LIMIT_DURATION);
        }
    }

    public void resetRateLimit(String email) {
        redisTemplate.delete(getRateLimitKey(email));
    }

    // --- Key Generators (Tránh lặp code ghép chuỗi) ---
    private String getOtpKey(String email) {
        return OTP_PREFIX + email;
    }

    private String getRateLimitKey(String email) {
        return RATE_LIMIT_PREFIX + email;
    }
}