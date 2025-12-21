package com.tranan.authservice.infrastructure.client.internal;

import com.tranan.authservice.annotation.ApiMessage;
import com.tranan.authservice.application.usecase.UserService;
import com.tranan.authservice.infrastructure.client.dto.UserInfoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/internal/users")
@Slf4j
@RequiredArgsConstructor
public class InternalUserController {
    private final UserService userService;

    @GetMapping("/{email}")
    @ApiMessage(value = "Lấy dữ liệu")
    public UserInfoResponse getUserByEmail(@PathVariable String email) {
        log.info("Internal call: Getting user info for {}", email);
        return userService.getUserInfo(email);
    }

    @GetMapping("/batch")
    @ApiMessage(value = "Lấy dữ liệu")
    public List<UserInfoResponse> getUsersByEmails(@RequestParam List<String> emails) {
        log.info("Internal call: Getting {} users info", emails.size());
        return userService.getUserInfoBatch(emails);
    }
}
