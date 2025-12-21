package com.tranan.authservice.presentation.controller;

import com.tranan.authservice.annotation.ApiMessage;
import com.tranan.authservice.application.dto.request.user.*;
import com.tranan.authservice.application.dto.response.PageResponseDto;
import com.tranan.authservice.application.dto.response.user.UserResponse;
import com.tranan.authservice.application.usecase.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "User Management")
@RestController
@RequestMapping("/api/users") // Đồng bộ với Gateway
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========================================================================
    // 1. ADMIN - QUẢN LÝ USER
    // ========================================================================

    @PostMapping
    @ApiMessage("Tạo User thành công")
    @PreAuthorize("hasAuthority('POST /api/users')")
    @Operation(summary = "Tạo User (Admin)", description = "Yêu cầu quyền: <b>POST /api/users</b>")
    public ResponseEntity<UserResponse> saveUser(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }

    @GetMapping
    @ApiMessage("Lấy danh sách User")
    @PreAuthorize("hasAuthority('GET /api/users')")
    @Operation(summary = "Lấy danh sách User", description = "Yêu cầu quyền: <b>GET /api/users</b>")
    public ResponseEntity<PageResponseDto<UserResponse>> findAllUsers(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        // 1. Gọi service searchUsers với keyword + pageable
        Page<UserResponse> page = userService.searchUsers(keyword, pageable);

        // 2. Map sang PageResponseDto (class tiện ích của bạn)
        PageResponseDto<UserResponse> res = new PageResponseDto<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());

        return ResponseEntity.ok(res);
    }

    @GetMapping("/{id}")
    @ApiMessage("Tìm User theo ID")
    @PreAuthorize("hasAuthority('GET /api/users/{id}')")
    @Operation(summary = "Tìm User theo ID", description = "Yêu cầu quyền: <b>GET /api/users/{id}</b>")
    public ResponseEntity<UserResponse> findUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping
    @ApiMessage("Cập nhật User")
    @PreAuthorize("hasAuthority('PUT /api/users')")
    @Operation(summary = "Cập nhật User (Admin)", description = "Yêu cầu quyền: <b>PUT /api/users</b>")
    public ResponseEntity<UserResponse> updateUser(@Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUser(request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa User theo ID")
    @PreAuthorize("hasAuthority('DELETE /api/users/{id}')")
    @Operation(summary = "Xóa User theo ID", description = "Yêu cầu quyền: <b>DELETE /api/users/{id}</b>")
    public ResponseEntity<UserResponse> deleteUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }

    // ========================================================================
    // 2. SELF - USER TỰ QUẢN LÝ (PROFILE, PASSWORD)
    // ========================================================================

    @PostMapping("/me/update-profile")
    @ApiMessage("Cập nhật Profile cá nhân")
    @Operation(summary = "Cập nhật Profile của người dùng hiện tại")
    public ResponseEntity<UserResponse> updateSelfUserProfile(
            @Valid @RequestBody SelfUserUpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateSelfProfile(request));
    }

    @PostMapping("/me/update-password")
    @ApiMessage("Cập nhật Password cá nhân")
    @Operation(summary = "Cập nhật Password của người dùng hiện tại")
    public ResponseEntity<UserResponse> updateSelfUserPassword(
            @Valid @RequestBody SelfUserUpdatePasswordRequest request) {
        return ResponseEntity.ok(userService.updateSelfPassword(request));
    }

    @PostMapping("/me/upload-avatar")
    @ApiMessage("Cập nhật Avatar cá nhân")
    @Operation(summary = "Cập nhật Avatar của người dùng hiện tại")
    // public ResponseEntity<Void> updateSelfUserAvatar(@RequestParam("avatar")
    // MultipartFile avatarFile) {
    // userService.updateSelfAvatar(avatarFile);
    // return ResponseEntity.ok().build();
    // }
    public ResponseEntity<Map<String, String>> updateSelfUserAvatar(@RequestParam("avatar") MultipartFile avatarFile) {

        // 2. Nhận url từ Service
        String newAvatarUrl = userService.updateSelfAvatar(avatarFile);

        // 3. Đóng gói vào JSON: { "url": "https://s3..." } gửi cho Frontend
        return ResponseEntity.ok(Map.of("url", newAvatarUrl));
    }

    // ========================================================================
    // 3. ADMIN STATISTICS - Dashboard
    // ========================================================================

    @GetMapping("/admin/stats")
    @ApiMessage("Lấy thống kê người dùng")
    @PreAuthorize("hasAuthority('GET /api/users/admin/stats')")
    @Operation(summary = "Lấy thống kê người dùng (Admin)", description = "Yêu cầu quyền: <b>GET /api/users/admin/stats</b>. Trả về tổng số người dùng.")
    public ResponseEntity<com.tranan.authservice.application.dto.response.user.UserStatsResponse> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }
}