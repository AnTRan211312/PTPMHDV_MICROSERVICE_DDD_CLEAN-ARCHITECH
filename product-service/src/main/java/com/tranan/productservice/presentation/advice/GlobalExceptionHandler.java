package com.tranan.productservice.presentation.advice;

import com.tranan.productservice.application.dto.response.ApiResponse;
import com.tranan.productservice.presentation.advice.exception.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@RestControllerAdvice

public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        ex.getMessage(),
                        "ENTITY_NOT_FOUND"
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex) {
        String message = ex
                .getBindingResult()
                .getAllErrors()
                .stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "VALIDATION_ERROR"
                ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        ex.getMessage(),
                        "DATA_INTEGRITY_VIOLATION"
                ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex
    ) {
        assert ex.getRequiredType() != null;
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        ex.getName() + " phải là " + ex.getRequiredType().getSimpleName(),
                        "PARAM_TYPE_MISMATCH"
                ));
    }

    @ExceptionHandler(value = {
            UsernameNotFoundException.class,
            BadCredentialsException.class
    })
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException() {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        "Thông tin đăng nhập không hợp lệ",
                        "BAD_CREDENTIALS"
                ));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNoResourceFoundException() {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        "Không tìm thấy URL này",
                        "RESOURCE_NOT_FOUND"
                ));
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<ApiResponse<?>> handleMissingRequestCookieException(
            MissingRequestCookieException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        "Không tìm thấy cookie " + ex.getCookieName(),
                        "MISSING_COOKIE"
                ));
    }

    @ExceptionHandler(BadJwtException.class)
    public ResponseEntity<ApiResponse<?>> handleBadJwtException(
            BadJwtException ex
    ) {
        String message = "Token không hợp lệ (không đúng định dạng, hết hạn)";
        if (ex.getMessage() != null)
            message = ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        message,
                        "UNAUTHORIZED"
                ));
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceAlreadyExistsException(
            ResourceAlreadyExistsException ex
    ) {
        String message = "Tài nguyên này đã tồn tại";
        if (ex.getMessage() != null)
            message = ex.getMessage();


        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        message,
                        "ENTITY_ALREADY_EXISTS"
                ));
    }

    @ExceptionHandler(InvalidImageDataException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidImageDataException(
            InvalidImageDataException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        ex.getMessage(),
                        "INVALID_IMAGE_DATA"
                ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFoundException(
            ResourceNotFoundException ex
    ) {
        String message = "Không tìm thấy tài nguyên";
        if (ex.getMessage() != null)
            message = ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        message,
                        "RESOURCE_NOT_FOUND"
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(
            AccessDeniedException ex
    ) {
        String message = "Không có quyền truy cập";
        if (ex.getMessage() != null)
            message = ex.getMessage();


        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        message,
                        "ACCESS_DENIED"
                ));
    }

    @ExceptionHandler(ImmutableFieldException.class)
    public ResponseEntity<ApiResponse<?>> handleImmutableFieldException(
            ImmutableFieldException ex
    ) {
        String message = "Không có quyền truy cập";
        if (ex.getMessage() != null)
            message = ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        message,
                        "IMMUTABLE_FIELD"
                ));
    }

    @ExceptionHandler(S3UploadException.class)
    public ResponseEntity<ApiResponse<?>> handleS3UploadException(
            S3UploadException ex
    ) {
        String message = "Tải tệp lên AWS S3 thất bại";
        if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(
                        message,
                        "S3_UPLOAD_ERROR"
                ));
    }


    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(
            IllegalArgumentException ex
    ) {
        // 1. Gán thông báo mặc định (nếu cần)
        String message = "Otp không hợp lệ";

        // 2. Kiểm tra và sử dụng thông báo chi tiết từ Service
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        // 3. Trả về phản hồi chuẩn
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message, // Sẽ là thông báo chi tiết về Rate Limit, OTP hết hạn, v.v.
                        "INVALID_ARGUMENT"
                ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalStateException(
            IllegalStateException ex
    ) {
        String message = "Trạng thái không hợp lệ";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "ILLEGAL_STATE"
                ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraintViolationException(
            ConstraintViolationException ex
    ) {
        String message = ex.getConstraintViolations()
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "VALIDATION_ERROR"
                ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<?>> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        "Thiếu tham số bắt buộc: " + ex.getParameterName(),
                        "MISSING_PARAMETER"
                ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ApiResponse<>(
                        "Phương thức HTTP '" + ex.getMethod() + "' không được hỗ trợ cho endpoint này",
                        "METHOD_NOT_ALLOWED"
                ));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpMediaTypeNotSupportedException(
            HttpMediaTypeNotSupportedException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ApiResponse<>(
                        "Content-Type '" + ex.getContentType() + "' không được hỗ trợ",
                        "UNSUPPORTED_MEDIA_TYPE"
                ));
    }

    // Generic exception handler - catch-all cho các exception chưa được xử lý
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        // Log exception chi tiết cho debugging
        ex.printStackTrace();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(
                        "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
                        "INTERNAL_SERVER_ERROR"
                ));
    }

}



