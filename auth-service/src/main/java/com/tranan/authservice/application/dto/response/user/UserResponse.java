package com.tranan.authservice.application.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private LocalDate dob;
    private String phoneNumber;
    private String address;
    private String gender;
    private String logoUrl;
    private RoleInformationDto role;
    private Instant createdAt;
    private Instant updatedAt;


    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    public static class RoleInformationDto {
        private Long id;
        private String name;
        private String description;
    }


}
