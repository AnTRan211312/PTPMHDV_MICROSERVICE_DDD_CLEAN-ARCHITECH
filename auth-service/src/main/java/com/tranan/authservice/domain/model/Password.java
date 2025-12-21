package com.tranan.authservice.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor  // Cần thiết cho một số thư viện mapping
@AllArgsConstructor // <--- QUAN TRỌNG: Tạo ra new Password(String value)
public class Password {
    private String value;
}