package com.tranan.authservice.application.dto.request.auth;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Tên người dùng không được để trống")
    private String name;

    @NotBlank(message = "Email người dùng không được để trống")
    @Email(message = "Định dạng email không hợp lệ", regexp = "^[\\w\\-.]+@([\\w\\-]+\\.)+[\\w\\-]{2,4}$")
    private String email;

    @NotBlank(message = "Mật khẩu người dùng không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;
    // Regex này chấp nhận: 0987654321 hoặc 84987654321 hoặc +84987654321
    // Giải thích:
    // ^ : Bắt đầu chuỗi
    // (\\+84|0) : Bắt đầu bằng "+84" HOẶC "0"
    // [3|5|7|8|9] : Số tiếp theo là các đầu mạng VN (3,5,7,8,9)
    // [0-9]{8} : 8 số tiếp theo bất kỳ
    // $ : Kết thúc chuỗi
    @Pattern(regexp = "^0[0-9]{9}$", message = "Số điện thoại phải có 10 số và bắt đầu bằng 0")
    private String phoneNumber;
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dateBirth;

    private String address;

    @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giới tính không hợp lệ")
    private String gender;
}
