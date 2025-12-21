package com.tranan.authservice.application.dto.response.user;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserSessionResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private List<String> permissions;
    private String logoUrl;
    private String updatedAt;
}
