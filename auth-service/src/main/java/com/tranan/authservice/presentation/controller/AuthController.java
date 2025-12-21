package com.tranan.authservice.presentation.controller;

import com.tranan.authservice.annotation.ApiMessage; // Đảm bảo bạn đã move annotation này
import com.tranan.authservice.application.dto.request.auth.*;
import com.tranan.authservice.application.dto.response.auth.*;
import com.tranan.authservice.application.dto.response.user.UserDetailsResponse;
import com.tranan.authservice.application.dto.response.user.UserSessionResponse;
import com.tranan.authservice.application.usecase.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Auth Controller")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ========================================================================
    // 1. LOGIN / REGISTER / LOGOUT
    // ========================================================================

    @PostMapping("/register")
    @ApiMessage(value = "Đăng ký thành công")
    @Operation(summary = "Người dùng đăng ký")
    @SecurityRequirements()
    public ResponseEntity<UserSessionResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.handleRegister(request));
    }

    @PostMapping("/login")
    @ApiMessage(value = "Đăng nhập thành công")
    @Operation(summary = "Người dùng đăng nhập")
    @SecurityRequirements()
    public ResponseEntity<AuthTokenResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResult authResult = authService.handleLogin(request);

        // Logic cũ của bạn: Tách Cookie và Body -> OK
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authResult.getResponseCookie().toString())
                .body(authResult.getAuthTokenResponse());
    }

    @PostMapping("/logout")
    @ApiMessage(value = "Đăng xuất thành công")
    @Operation(summary = "Người dùng đăng xuất")
    public ResponseEntity<Void> logout(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        ResponseCookie responseCookie = authService.handleLogout(refreshToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, responseCookie.toString())
                .build();
    }

    @PostMapping("/refresh-token")
    @ApiMessage(value = "Lấy refresh token thành công")
    @Operation(summary = "Cấp lại access token và refresh token mới")
    public ResponseEntity<AuthTokenResponse> refreshToken(
            @CookieValue(value = "refresh_token") String refreshToken,
            @RequestBody SessionMetaRequest sessionMetaRequest
    ) {
        AuthResult authResult = authService.handleRefresh(refreshToken, sessionMetaRequest);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authResult.getResponseCookie().toString())
                .body(authResult.getAuthTokenResponse());
    }

    // ========================================================================
    // 2. USER INFO & SESSION MANAGEMENT
    // ========================================================================

    @GetMapping("/me")
    @ApiMessage(value = "Lấy thông tin người dùng hiện tại")
    @Operation(summary = "Lấy thông tin rút gọn (Session)")
    public ResponseEntity<UserSessionResponse> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @GetMapping("/me/details")
    @ApiMessage(value = "Lấy thông tin chi tiết người dùng")
    @Operation(summary = "Lấy thông tin chi tiết (Profile)")
    public ResponseEntity<UserDetailsResponse> getCurrentUserDetails() {
        return ResponseEntity.ok(authService.getCurrentUserDetails());
    }

    @GetMapping("/sessions")
    @ApiMessage(value = "Lấy danh sách phiên đăng nhập")
    @Operation(summary = "Lấy tất cả phiên đăng nhập của người dùng")
    public ResponseEntity<List<SessionMetaResponse>> getAllSelfSessionMetas(
            @CookieValue(value = "refresh_token") String refreshToken
    ) {
        return ResponseEntity.ok(authService.getAllSelfSessionMetas(refreshToken));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @ApiMessage(value = "Xóa phiên đăng nhập")
    @Operation(summary = "Thu hồi phiên đăng nhập cụ thể")
    public ResponseEntity<Void> removeSelfSession(@PathVariable String sessionId) {
        authService.removeSelfSession(sessionId);
        return ResponseEntity.ok().build();
    }

    // ========================================================================
    // 3. [NEW] PASSWORD RECOVERY (OTP) - Phần này Controller cũ chưa có
    // ========================================================================

    @PostMapping("/forgot-password")
    @ApiMessage(value = "Gửi OTP thành công")
    @Operation(summary = "Yêu cầu quên mật khẩu")
    @SecurityRequirements()
    public ResponseEntity<OtpResponse> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.sendOtpForPasswordReset(request));
    }

    @PostMapping("/resend-otp")
    @ApiMessage(value = "Gửi lại OTP thành công")
    @Operation(summary = "Gửi lại mã OTP")
    @SecurityRequirements()
    public ResponseEntity<OtpResponse> resendOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.resendOtp(request));
    }

    @PostMapping("/verify-otp")
    @ApiMessage(value = "Xác thực OTP thành công")
    @Operation(summary = "Kiểm tra mã OTP (trước khi đổi pass)")
    @SecurityRequirements()
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@RequestBody @Valid VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PostMapping("/reset-password")
    @ApiMessage(value = "Đặt lại mật khẩu thành công")
    @Operation(summary = "Đặt lại mật khẩu mới")
    @SecurityRequirements()
    public ResponseEntity<ResetPasswordResponse> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

}