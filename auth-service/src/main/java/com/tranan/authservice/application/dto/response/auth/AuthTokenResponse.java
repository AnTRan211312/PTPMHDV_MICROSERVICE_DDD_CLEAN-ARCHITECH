package com.tranan.authservice.application.dto.response.auth;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.tranan.authservice.application.dto.response.user.UserSessionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;



@AllArgsConstructor
@NoArgsConstructor
@Data
@JsonPropertyOrder({"user", "accessToken"})
public class AuthTokenResponse {
    @JsonProperty("user")
    private UserSessionResponse userSessionResponse;
    private String accessToken;
}
