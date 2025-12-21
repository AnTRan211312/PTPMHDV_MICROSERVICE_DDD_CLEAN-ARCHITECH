package com.tranan.authservice.application.dto.response.permission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PermissionResponse {
    private Long id;
    private String name;
    private String apiPath;
    private String method;
    private String module;
    private String createdAt;
    private String updatedAt;
}
