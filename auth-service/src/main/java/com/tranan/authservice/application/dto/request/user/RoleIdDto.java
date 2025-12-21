package com.tranan.authservice.application.dto.request.user;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class RoleIdDto {
    @NotNull(message = "Chức vụ không được để trống")
    private Long id;
}

