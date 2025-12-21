package com.tranan.authservice.application.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseCookie;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class AuthResult {

    private AuthTokenResponse authTokenResponse;
    private ResponseCookie responseCookie;
}
