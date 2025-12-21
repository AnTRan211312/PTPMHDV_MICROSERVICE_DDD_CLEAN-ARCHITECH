package com.tranan.authservice.application.dto.request.permission;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PermissionRequest {
    @NotBlank(message = "Tên không được để trống")
    private String name;

    @NotBlank(message = "Đường dẫn không được để trống")
    private String apiPath;

    @NotBlank(message = "Phương thức không được để trống")
    private String method;

    @NotBlank(message = "Module không được để trống")
    private String module;
}
