package com.tranan.authservice.application.dto.request.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserUpdateRequest {
    private Long id;
    private String name;
    private String gender;
    private LocalDate birthdate;
    private String phoneNumber;
    private String address;
    private RoleIdDto role;
}
