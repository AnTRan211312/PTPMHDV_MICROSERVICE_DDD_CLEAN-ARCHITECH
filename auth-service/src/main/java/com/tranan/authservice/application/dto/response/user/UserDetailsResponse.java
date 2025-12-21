package com.tranan.authservice.application.dto.response.user;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDetailsResponse {
    private Long id;
    private String name;        // Map từ user.username
    private String email;
    private LocalDate dob;
    private String phoneNumber; // Map từ user.birthDate
    private String address;
    private String gender;      // Map từ user.gender (Enum -> String)
    private String logoUrl;
    private Instant createdAt;  // Domain đã có field này
    private Instant updatedAt;  // Domain
}
