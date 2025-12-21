package com.tranan.inventoryservice.presentation.advice;

import com.tranan.inventoryservice.application.dto.response.ApiResponse;
import com.tranan.inventoryservice.presentation.advice.exception.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
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

    // ========== Inventory Service Domain Exceptions ==========

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalStateException(IllegalStateException ex) {
        String message = "Đã xảy ra lỗi trong quá trình xử lý";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage(); // Giữ nguyên message từ service
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        message,
                        "INVENTORY_ALREADY_EXISTS"
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(IllegalArgumentException ex) {
        String message = "Yêu cầu không hợp lệ";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            if (ex.getMessage().contains("Không thể tạo kho")) {
                message = ex.getMessage(); // Message cụ thể từ service
            } else {
                message = "Tham số không hợp lệ: " + ex.getMessage();
            }
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "BAD_REQUEST"
                ));
    }

    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ApiResponse<?>> handleOptimisticLock(OptimisticLockException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        "Kho hàng đang được cập nhật bởi người khác. Vui lòng thử lại sau.",
                        "OPTIMISTIC_LOCK_ERROR"
                ));
    }

    // ========== General Exception Handlers ==========

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        "Không tìm thấy dữ liệu yêu cầu",
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

        // Thêm tiền tố cho message rõ ràng hơn
        String finalMessage = "Dữ liệu không hợp lệ: " + message;

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        finalMessage,
                        "VALIDATION_ERROR"
                ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex) {
        String message = "Dữ liệu không hợp lệ hoặc bị trùng lặp";
        if (ex.getMessage() != null && ex.getMessage().contains("constraint")) {
            if (ex.getMessage().contains("unique") || ex.getMessage().contains("duplicate")) {
                message = "Dữ liệu đã tồn tại trong hệ thống";
            } else if (ex.getMessage().contains("foreign key")) {
                message = "Không thể thực hiện do tham chiếu dữ liệu không hợp lệ";
            }
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        message,
                        "DATA_INTEGRITY_VIOLATION"
                ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex) {
        String paramName = ex.getName();
        String expectedType = ex.getRequiredType() != null ?
                ex.getRequiredType().getSimpleName() : "unknown";

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        "Tham số '" + paramName + "' phải có kiểu dữ liệu " + expectedType,
                        "PARAM_TYPE_MISMATCH"
                ));
    }

    @ExceptionHandler(value = {UsernameNotFoundException.class, BadCredentialsException.class})
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(Exception ex) {
        String message = "Thông tin đăng nhập không hợp lệ";
        if (ex instanceof BadCredentialsException) {
            message = "Tên đăng nhập hoặc mật khẩu không đúng";
        } else if (ex instanceof UsernameNotFoundException) {
            message = "Tài khoản không tồn tại";
        }

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        message,
                        "AUTHENTICATION_ERROR"
                ));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNoResourceFoundException() {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        "Không tìm thấy tài nguyên hoặc đường dẫn không tồn tại",
                        "RESOURCE_NOT_FOUND"
                ));
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<ApiResponse<?>> handleMissingRequestCookieException(
            MissingRequestCookieException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        "Thiếu thông tin xác thực: cookie '" + ex.getCookieName() + "' không được tìm thấy",
                        "MISSING_COOKIE"
                ));
    }

    @ExceptionHandler(BadJwtException.class)
    public ResponseEntity<ApiResponse<?>> handleBadJwtException(BadJwtException ex) {
        String message = "Token xác thực không hợp lệ";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("expired")) {
                message = "Token đã hết hạn. Vui lòng đăng nhập lại";
            } else if (ex.getMessage().contains("signature")) {
                message = "Token không hợp lệ (chữ ký không đúng)";
            } else if (ex.getMessage().contains("malformed")) {
                message = "Token có định dạng không đúng";
            }
        }

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        message,
                        "INVALID_TOKEN"
                ));
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceAlreadyExistsException(
            ResourceAlreadyExistsException ex) {
        String message = "Tài nguyên đã tồn tại trong hệ thống";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        message,
                        "RESOURCE_ALREADY_EXISTS"
                ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFoundException(
            ResourceNotFoundException ex) {
        String message = "Không tìm thấy tài nguyên yêu cầu";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        message,
                        "RESOURCE_NOT_FOUND"
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(AccessDeniedException ex) {
        String message = "Bạn không có quyền thực hiện thao tác này";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)  // 403 Forbidden (thay vì 401)
                .body(new ApiResponse<>(
                        message,
                        "ACCESS_DENIED"
                ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<?>> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        "Thiếu tham số bắt buộc: '" + ex.getParameterName() + "'",
                        "MISSING_PARAMETER"
                ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ApiResponse<>(
                        "Phương thức HTTP '" + ex.getMethod() + "' không được hỗ trợ cho endpoint này",
                        "METHOD_NOT_ALLOWED"
                ));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpMediaTypeNotSupportedException(
            HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ApiResponse<>(
                        "Định dạng dữ liệu không được hỗ trợ. Vui lòng sử dụng Content-Type hợp lệ",
                        "UNSUPPORTED_MEDIA_TYPE"
                ));
    }

    @ExceptionHandler(InventoryNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleInventoryNotFoundException(InventoryNotFoundException ex) {
        String message = "Không tìm thấy thông tin kho hàng";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        message,
                        "INVENTORY_NOT_FOUND"
                ));
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ApiResponse<?>> handleInsufficientStockException(InsufficientStockException ex) {
        String message = "Số lượng hàng trong kho không đủ";
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            message = ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        message,
                        "INSUFFICIENT_STOCK"
                ));
    }

    // Generic exception handler - catch-all cho các exception chưa được xử lý
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        // Log exception chi tiết cho debugging
        ex.printStackTrace();

        String message = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.";

        // Có thể phân loại thêm một số exception thông thường
        if (ex instanceof NullPointerException) {
            message = "Lỗi xử lý dữ liệu (null reference)";
        } else if (ex instanceof RuntimeException && ex.getMessage() != null) {
            message = "Lỗi hệ thống: " + ex.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(
                        message,
                        "INTERNAL_SERVER_ERROR"
                ));
    }

    // Thêm handler cho ConstraintViolationException (nếu cần)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraintViolationException(
            ConstraintViolationException ex) {
        String message = ex.getConstraintViolations()
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        "Ràng buộc dữ liệu không hợp lệ: " + message,
                        "CONSTRAINT_VIOLATION"
                ));
    }
}