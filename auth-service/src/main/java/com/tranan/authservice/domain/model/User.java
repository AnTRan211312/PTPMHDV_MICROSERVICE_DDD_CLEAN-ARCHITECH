package com.tranan.authservice.domain.model;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class User {
    private Long id;
    private String username;
    private String email;
    private Password password;
    private String phoneNumber;
    private LocalDate birthDate;
    private String address;
    private DomainGender gender;

    private String logoUrl;
    private Role role;
    private Instant createdAt;
    private Instant updatedAt;

    // Constructor cho Builder và Mapper
    // Đã bỏ hết logic check null/empty
    public User(Long id, String username, String email, Password password,
            String phoneNumber, LocalDate birthDate, String address,
            DomainGender gender,
            String logoUrl, Role role, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.birthDate = birthDate;
        this.address = address;
        this.gender = gender;
        this.logoUrl = logoUrl;
        this.role = role;
        this.createdAt = createdAt; // <--- Gán giá trị
        this.updatedAt = updatedAt; // <--- Gán giá trị
    }

    public static User createUser(String username, String email, Password password,
            String phoneNumber, LocalDate birthDate, String address,
            DomainGender gender,
            String logoUrl, Role role) {
        return User.builder()
                .id(null) // <--- QUAN TRỌNG: ID phải là null để kích hoạt Auto Increment
                .username(username)
                .email(email)
                .password(password)
                .phoneNumber(phoneNumber)
                .birthDate(birthDate)
                .address(address)
                .gender(gender)
                .logoUrl(logoUrl)
                .role(role)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    // Cập nhật profile
    public void updateProfile(String username, LocalDate birthDate, String address,
            DomainGender gender, String logoUrl, String phoneNumber) {
        this.username = username;
        this.birthDate = birthDate;
        this.address = address;
        this.gender = gender;
        this.logoUrl = logoUrl;
        this.phoneNumber = phoneNumber;
    }

    // Role management
    public void assignRole(Role role) {
        this.role = role;
    }

    public void removeRole() {
        this.role = null;
    }

    // Change password
    public void changePassword(Password newPassword) {
        this.password = newPassword;
    }

    // Update gender
    public void updateGender(DomainGender domainGender) {
        this.gender = domainGender;
    }
}