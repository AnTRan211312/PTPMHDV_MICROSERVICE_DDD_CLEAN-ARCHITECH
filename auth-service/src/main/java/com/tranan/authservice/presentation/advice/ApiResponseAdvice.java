package com.tranan.authservice.presentation.advice;

import com.tranan.authservice.annotation.ApiMessage;

import com.tranan.authservice.application.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.Arrays;
import java.util.List;

@RestControllerAdvice
public class ApiResponseAdvice implements ResponseBodyAdvice<Object> {
    private static final List<String> EXCLUDE_PATTERMS = Arrays.asList(
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/swagger-resources/**",
            "/webjars/**",
            "/actuator/**",
            "/error",
            "/doc.html",
            "/api/internal/**"
    );

    private static final AntPathMatcher ANT_PATH_MATCHER = new AntPathMatcher();

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            String path = attributes.getRequest().getRequestURI();
            for(String pattern : EXCLUDE_PATTERMS){
                if(ANT_PATH_MATCHER.match(pattern, path)){
                    return false;
                }
            }
        }
        Class<?> returnTypeClass = returnType.getParameterType();
        return returnTypeClass !=  byte[].class
                && !org.springframework.core.io.Resource.class.isAssignableFrom(returnTypeClass)
                && !org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody.class.isAssignableFrom(returnTypeClass);
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType, Class<? extends HttpMessageConverter<?>> selectedConverterType, ServerHttpRequest request, ServerHttpResponse response) {
        HttpServletResponse responses = ((ServletServerHttpResponse) response).getServletResponse();
        int status = responses.getStatus();
        if(body instanceof ApiResponse<?> || body instanceof String){
            return body;
        }
        ApiMessage apiMessage = returnType.getMethodAnnotation(ApiMessage.class);
        if(status >= 400){
            return new ApiResponse<>(
                    apiMessage == null ? "fail" : apiMessage.value(),status
            );
        }
        return new ApiResponse<>(
                apiMessage == null ? "Success" : apiMessage.value(),
                body
        );
    }
}
