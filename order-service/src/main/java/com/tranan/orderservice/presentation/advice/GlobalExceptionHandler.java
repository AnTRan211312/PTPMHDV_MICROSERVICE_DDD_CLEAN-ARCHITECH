package com.tranan.orderservice.presentation.advice;

import com.tranan.orderservice.application.dto.response.ApiResponse;

import com.tranan.orderservice.presentation.advice.exception.InvalidOrderOperationException;
import com.tranan.orderservice.presentation.advice.exception.OutOfStockException;
import com.tranan.orderservice.presentation.advice.exception.PaymentFailedException;
import com.tranan.orderservice.presentation.advice.exception.ResourceAlreadyExistsException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.apache.kafka.common.errors.ResourceNotFoundException;
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
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // --- 1. CORE EXCEPTIONS (DB & NOT FOUND) ---

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        ex.getMessage(), // Ví dụ: "Không tìm thấy đơn hàng với ID..."
                        "ENTITY_NOT_FOUND"
                ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        String message = "Không tìm thấy tài nguyên yêu cầu";
        if (ex.getMessage() != null) message = ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        message,
                        "RESOURCE_NOT_FOUND"
                ));
    }

    // --- 2. ORDER SPECIFIC EXCEPTIONS (Nghiệp vụ đơn hàng) ---

    // Xử lý khi kho hết hàng (Rất quan trọng với Order Service)
    @ExceptionHandler(OutOfStockException.class)
    public ResponseEntity<ApiResponse<?>> handleOutOfStockException(OutOfStockException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT) // Hoặc BAD_REQUEST tùy logic
                .body(new ApiResponse<>(
                        ex.getMessage(), // Ví dụ: "Sản phẩm X chỉ còn 2 items"
                        "OUT_OF_STOCK"
                ));
    }

    // Xử lý lỗi thanh toán
    @ExceptionHandler(PaymentFailedException.class)
    public ResponseEntity<ApiResponse<?>> handlePaymentFailedException(PaymentFailedException ex) {
        return ResponseEntity
                .status(HttpStatus.PAYMENT_REQUIRED) // 402 hoặc 400
                .body(new ApiResponse<>(
                        ex.getMessage(),
                        "PAYMENT_FAILED"
                ));
    }

    // Xử lý thao tác không hợp lệ trên đơn hàng (VD: Hủy đơn khi đã giao)
    @ExceptionHandler(InvalidOrderOperationException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidOrderOperationException(InvalidOrderOperationException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        ex.getMessage(),
                        "INVALID_ORDER_OPERATION"
                ));
    }

    // --- 3. VALIDATION & DATA INTEGRITY ---

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "VALIDATION_ERROR"
                ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraintViolationException(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "VALIDATION_ERROR"
                ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        "Dữ liệu không hợp lệ hoặc bị trùng lặp (khóa ngoại/khóa chính)",
                        "DATA_INTEGRITY_VIOLATION"
                ));
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceAlreadyExistsException(ResourceAlreadyExistsException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(
                        ex.getMessage() != null ? ex.getMessage() : "Tài nguyên đã tồn tại",
                        "ENTITY_ALREADY_EXISTS"
                ));
    }

    // --- 4. AUTHENTICATION & SECURITY ---

    @ExceptionHandler({UsernameNotFoundException.class, BadCredentialsException.class})
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException() {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        "Thông tin đăng nhập không chính xác",
                        "BAD_CREDENTIALS"
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN) // Order Service nên dùng 403 cho Access Denied
                .body(new ApiResponse<>(
                        "Bạn không có quyền thực hiện thao tác này trên đơn hàng",
                        "ACCESS_DENIED"
                ));
    }

    @ExceptionHandler(BadJwtException.class)
    public ResponseEntity<ApiResponse<?>> handleBadJwtException(BadJwtException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        "Token không hợp lệ hoặc đã hết hạn",
                        "UNAUTHORIZED"
                ));
    }

    // --- 5. REQUEST HANDLING ERRORS ---

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        assert ex.getRequiredType() != null;
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        String.format("Tham số '%s' phải là kiểu %s", ex.getName(), ex.getRequiredType().getSimpleName()),
                        "PARAM_TYPE_MISMATCH"
                ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<?>> handleMissingServletRequestParameterException(MissingServletRequestParameterException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        "Thiếu tham số bắt buộc: " + ex.getParameterName(),
                        "MISSING_PARAMETER"
                ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ApiResponse<>(
                        "Phương thức " + ex.getMethod() + " không hỗ trợ",
                        "METHOD_NOT_ALLOWED"
                ));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ApiResponse<>(
                        "Kiểu dữ liệu (Content-Type) không được hỗ trợ",
                        "UNSUPPORTED_MEDIA_TYPE"
                ));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNoResourceFoundException() {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        "Đường dẫn không tồn tại",
                        "ENDPOINT_NOT_FOUND"
                ));
    }

    // --- 6. GENERIC / LOGIC EXCEPTIONS ---

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(IllegalArgumentException ex) {
        // Xử lý các lỗi logic chung (ví dụ: tính toán giá tiền sai, mã giảm giá không đúng format)
        String message = "Tham số không hợp lệ";
        if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            message = ex.getMessage();
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "INVALID_ARGUMENT"
                ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalStateException(IllegalStateException ex) {
        // Xử lý sai lệch trạng thái đơn hàng chung chung
        String message = "Trạng thái đơn hàng không hợp lệ";
        if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            message = ex.getMessage();
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        message,
                        "ILLEGAL_STATE"
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        ex.printStackTrace(); // Nên dùng Logger thay vì printStackTrace trong Production
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(
                        "Lỗi hệ thống xử lý đơn hàng. Vui lòng thử lại sau.",
                        "INTERNAL_SERVER_ERROR"
                ));
    }
}