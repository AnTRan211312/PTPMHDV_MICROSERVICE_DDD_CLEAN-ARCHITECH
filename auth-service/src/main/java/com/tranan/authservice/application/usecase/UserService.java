package com.tranan.authservice.application.usecase;

import com.tranan.authservice.application.dto.request.user.SelfUserUpdatePasswordRequest;
import com.tranan.authservice.application.dto.request.user.SelfUserUpdateProfileRequest;
import com.tranan.authservice.application.dto.request.user.UserCreateRequest;
import com.tranan.authservice.application.dto.request.user.UserUpdateRequest;
import com.tranan.authservice.infrastructure.client.dto.UserInfoResponse;
import com.tranan.authservice.application.dto.response.user.UserResponse;
import com.tranan.authservice.domain.model.DomainGender;
import com.tranan.authservice.domain.model.Password;
import com.tranan.authservice.domain.model.Role;
import com.tranan.authservice.domain.model.User;
import com.tranan.authservice.domain.repository.RoleRepository;
import com.tranan.authservice.domain.repository.UserRepository;
import com.tranan.authservice.infrastructure.config.network.S3Service;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3Service s3Service; // Dịch vụ upload file (Infra)

    // ========================================================================
    // 1. ADMIN - QUẢN LÝ USER
    // ========================================================================

    public UserInfoResponse getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        return UserInfoResponse.builder()
                .email(user.getEmail())
                .name(user.getUsername())
                .avatar(user.getLogoUrl())
                .phoneNumber(user.getPhoneNumber())
                .build();
    }

    public List<UserInfoResponse> getUserInfoBatch(List<String> emails) {
        List<User> users = userRepository.findByEmailIn(emails);

        return users.stream()
                .map(user -> UserInfoResponse.builder()
                        .email(user.getEmail())
                        .name(user.getUsername())
                        .avatar(user.getLogoUrl())
                        .phoneNumber(user.getPhoneNumber())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        // 1. Validate Email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DataIntegrityViolationException("Email đã tồn tại");
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new DataIntegrityViolationException("Số điện thoại đã tồn tại");
            }
        }

        // 2. Xử lý Role (Nếu có gửi lên, không thì để null hoặc mặc định)
        Role role = null;
        if (request.getRole() != null && request.getRole().getId() != null) {
            role = roleRepository.findById(request.getRole().getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Không tìm thấy Role với ID: " + request.getRole().getId()));
        }

        // 3. Xử lý Password & Gender
        Password password = new Password(passwordEncoder.encode(request.getPassword()));
        DomainGender gender;
        try {
            gender = DomainGender.valueOf(request.getGender().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Giới tính không hợp lệ: " + request.getGender());
        }

        // 4. Tạo Domain Model (Dùng Factory Method)
        User user = User.createUser(
                request.getName(), // Map name -> username
                request.getEmail(),
                password,
                request.getPhoneNumber(), // Cần check nếu DTO có field này
                request.getDateBirth(), // Map dob -> birthDate
                request.getAddress(),
                gender,
                null,
                role);

        // Lưu ý: User Domain của bạn chưa có field Company, nếu cần hãy bổ sung vào
        // Domain Model

        // 5. Lưu & Trả về
        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(UserUpdateRequest request) {
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

        // 1. Update thông tin cơ bản
        DomainGender gender = DomainGender.valueOf(request.getGender());
        user.updateProfile(
                request.getName(),
                request.getBirthdate(),
                request.getAddress(),
                gender,
                user.getLogoUrl(), // Giữ nguyên logo cũ
                user.getPhoneNumber() // Giữ nguyên sđt cũ nếu DTO không có
        );

        // 2. Update Role (Nếu có thay đổi)
        if (request.getRole() != null) {
            if (request.getRole().getId() == -1) {
                user.removeRole();
            } else {
                Role role = roleRepository.findById(request.getRole().getId())
                        .orElseThrow(() -> new EntityNotFoundException("Role not found"));
                user.assignRole(role);
            }
        }

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

        // Logic xóa file trên S3 (nếu có resume/logo)
        if (user.getLogoUrl() != null) {
            // Cần parse key từ URL nếu s3Service yêu cầu key
            // s3Service.deleteFile(user.getLogoUrl());
        }

        userRepository.deleteById(id);
        return mapToResponse(user);
    }

    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    // ========================================================================
    // 2. SELF - USER TỰ QUẢN LÝ (PROFILE, PASSWORD)
    // ========================================================================

    @Transactional
    public UserResponse updateSelfProfile(SelfUserUpdateProfileRequest request) {
        User user = getCurrentUserDomain();

        // Convert Gender
        DomainGender gender = DomainGender.valueOf(request.getGender());

        // Gọi Domain Method
        user.updateProfile(
                request.getName(),
                request.getDateBirth(),
                request.getAddress(),
                gender,
                user.getLogoUrl(),
                user.getPhoneNumber() // Giữ nguyên nếu request không có
        );

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateSelfPassword(SelfUserUpdatePasswordRequest request) {
        User user = getCurrentUserDomain();

        // 1. Check Pass cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword().getValue())) {
            throw new DataIntegrityViolationException("Mật khẩu hiện tại không chính xác");
        }

        // 2. Đổi Pass mới (Domain Method)
        user.changePassword(new Password(passwordEncoder.encode(request.getNewPassword())));

        return mapToResponse(userRepository.save(user));
    }

    // @Transactional
    // public String updateSelfAvatar(MultipartFile avatarFile) {
    // User user = getCurrentUserDomain();
    //
    // if (avatarFile != null && !avatarFile.isEmpty()) {
    // // Upload S3 (Infra)
    // String url = s3Service.uploadFile(avatarFile, "avatar",
    // user.getId().toString(), true);
    //
    // // Update Domain (Tận dụng hàm updateProfile hoặc tạo hàm setLogoUrl riêng
    // trong Domain)
    // user.updateProfile(
    // user.getUsername(), user.getBirthDate(), user.getAddress(),
    // user.getGender(), url, user.getPhoneNumber()
    // );
    //
    // userRepository.save(user);
    // }
    // }
    @Transactional
    // 1. Đổi void thành String
    public String updateSelfAvatar(MultipartFile avatarFile) {
        User user = getCurrentUserDomain();

        if (avatarFile != null && !avatarFile.isEmpty()) {
            String url = s3Service.uploadFile(avatarFile, "avatar", user.getId().toString(), true);

            user.updateProfile(
                    user.getUsername(), user.getBirthDate(), user.getAddress(),
                    user.getGender(), url, user.getPhoneNumber());

            userRepository.save(user);

            // 2. Trả về url để Controller nhận được
            return url;
        }

        // Trường hợp không có file, có thể return null hoặc url cũ
        return user.getLogoUrl();
    }

    // --- PRIVATE HELPERS ---

    private User getCurrentUserDomain() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private UserResponse mapToResponse(User user) {
        if (user == null)
            return null;

        // Map Role
        UserResponse.RoleInformationDto roleDto = null;
        if (user.getRole() != null) {
            roleDto = new UserResponse.RoleInformationDto(
                    user.getRole().getId(),
                    user.getRole().getRoleName(),
                    user.getRole().getRoleDescription());
        }

        return new UserResponse(
                user.getId(),
                user.getUsername(), // user.name cũ
                user.getEmail(),
                user.getBirthDate(),
                user.getPhoneNumber(), // user.dob cũ
                user.getAddress(),
                (user.getGender() != null) ? user.getGender().name() : null,
                user.getLogoUrl(),
                roleDto,
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    public Page<UserResponse> searchUsers(String keyword, Pageable pageable) {
        // Gọi xuống repository với keyword + pageable
        return userRepository.searchUsers(keyword, pageable)
                .map(this::mapToResponse);
    }

    // ========================================================================
    // 3. DASHBOARD STATISTICS (Admin)
    // ========================================================================

    /**
     * Lấy thống kê người dùng cho Dashboard Admin
     */
    @Transactional(readOnly = true)
    public com.tranan.authservice.application.dto.response.user.UserStatsResponse getUserStats() {
        long totalUsers = userRepository.count();

        return com.tranan.authservice.application.dto.response.user.UserStatsResponse.builder()
                .totalUsers(totalUsers)
                .build();
    }

}
