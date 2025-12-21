package com.tranan.authservice.application.usecase;

import com.tranan.authservice.application.dto.request.auth.*;
import com.tranan.authservice.application.dto.response.auth.*;
import com.tranan.authservice.application.dto.response.user.UserDetailsResponse;
import com.tranan.authservice.application.dto.response.user.UserSessionResponse;
import com.tranan.authservice.domain.model.DomainGender;
import com.tranan.authservice.domain.model.Password;
import com.tranan.authservice.domain.model.Role;
import com.tranan.authservice.domain.model.User;
import com.tranan.authservice.domain.repository.RoleRepository;
import com.tranan.authservice.domain.repository.UserRepository;
import com.tranan.authservice.infrastructure.config.network.EmailService;
import com.tranan.authservice.infrastructure.config.network.OtpRedisService;
import com.tranan.authservice.infrastructure.config.network.RefreshTokenRedisService;
import com.tranan.authservice.infrastructure.config.network.SessionMeta;
import com.tranan.authservice.infrastructure.config.security.TokenProvider;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.stereotype.Service;
import com.tranan.authservice.application.dto.response.user.UserSessionResponse;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;

        private final AuthenticationManager authenticationManager;
        private final TokenProvider tokenProvider; // <--- Inject cái này vào
        private final RefreshTokenRedisService refreshTokenRedisService; // Service Redis cũ của bạn
        private final OtpRedisService otpRedisService;
        private final EmailService emailService;

        public UserSessionResponse handleRegister(RegisterRequest registerRequest) {
                if (userRepository.existsByEmail(registerRequest.getEmail())) {
                        throw new DataIntegrityViolationException("Email đã tồn tại");
                }
                DomainGender genderEnum = DomainGender.valueOf(registerRequest.getGender());
                Password passwordVO = new Password(passwordEncoder.encode(registerRequest.getPassword()));
                // String roleName = registerRequest.isManager() ? "MANAGER" : "USER"; // Giả sử
                // logic là vậy
                // String roleName = registerRequest.
                // Role role = roleRepository.findByRoleName(roleName)
                // .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Role"));
                Role role = roleRepository.findByRoleName("USER")
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Role"));

                User user = User.builder()
                                .username(registerRequest.getName())
                                .email(registerRequest.getEmail())
                                .password(passwordVO)
                                .phoneNumber(registerRequest.getPhoneNumber())
                                .gender(genderEnum)
                                .birthDate(registerRequest.getDateBirth())
                                .address(registerRequest.getAddress())
                                .role(role)
                                .build();

                User savedUser = userRepository.save(user);
                return mapToUserSessionResponse(savedUser);

        }

        public AuthResult handleLogin(LoginRequest loginRequest) {
                // BƯỚC 1: Xác thực với Spring Security (Giống cũ)
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(),
                                                loginRequest.getPassword()));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // BƯỚC 2: Lấy User Domain từ DB (Quan trọng: Trả về Domain User, không phải
                // Entity)
                User user = userRepository.findByEmail(loginRequest.getEmail())
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // BƯỚC 3: Delegate việc tạo Token cho Infrastructure (TokenProvider)
                String accessToken = tokenProvider.createAccessToken(user);
                String refreshToken = tokenProvider.createRefreshToken(user);
                ResponseCookie cookie = tokenProvider.buildRefreshCookie(refreshToken);
                var metaRequest = loginRequest.getSessionMetaRequest();

                // BƯỚC 4: Lưu Refresh Token vào Redis (Orchestration)
                // Lưu ý: convert userId sang String nếu cần
                refreshTokenRedisService.saveRefreshToken(
                                refreshToken,
                                user.getId().toString(),
                                metaRequest.getDeviceName(), // Truyền từng field
                                metaRequest.getDeviceType(),
                                metaRequest.getUserAgent(),
                                Duration.ofDays(7));

                // BƯỚC 5: Map sang DTO và trả về
                UserSessionResponse userDto = mapToUserSessionResponse(user);

                // Giả sử AuthTokenResponse chứa (UserDTO, AccessToken)
                AuthTokenResponse tokenResponse = new AuthTokenResponse(userDto, accessToken);

                return new AuthResult(tokenResponse, cookie);
        }

        private UserSessionResponse mapToUserSessionResponse(User user) {
                if (user == null) {
                        return null;
                }

                // 1. Xử lý Permissions: Chuyển từ List<Permission> object sang List<String>
                List<String> permissions = null;
                if (user.getRole() != null && user.getRole().getPermissions() != null) {
                        permissions = user.getRole().getPermissions().stream()
                                        .map(p -> p.getMethod() + " " + p.getApiPath()) // Ví dụ: "GET /api/users"
                                        .collect(Collectors.toList());
                }

                // 2. Xử lý Role Name (Check null an toàn)
                String roleName = (user.getRole() != null) ? user.getRole().getRoleName() : null;

                // 3. Xử lý UpdatedAt (Check null và convert sang String)
                String updatedAt = (user.getUpdatedAt() != null) ? user.getUpdatedAt().toString() : null;

                // 4. Build DTO trả về
                return UserSessionResponse.builder()
                                .id(user.getId())
                                .name(user.getUsername()) // Lưu ý: Domain thường là username, DTO là name
                                .email(user.getEmail())
                                .role(roleName)
                                .permissions(permissions)
                                .logoUrl(user.getLogoUrl())
                                .updatedAt(updatedAt)
                                .build();
        }

        public ResponseCookie handleLogout(String refreshToken) {
                // 1. Luôn chuẩn bị một cookie rỗng để trả về (đảm bảo client luôn logout được)
                ResponseCookie cleanCookie = tokenProvider.getCleanCookie();

                // 2. Nếu không có token gửi lên thì return luôn
                if (refreshToken == null || refreshToken.isBlank()) {
                        return cleanCookie;
                }

                // 3. Nhờ TokenProvider lấy email từ token
                String email = tokenProvider.extractSubject(refreshToken);

                // 4. Nếu token hợp lệ (lấy được email), tiến hành xóa trong Redis
                if (email != null) {
                        // Tìm User để lấy ID (Vì Redis key của bạn cần UserId)
                        // Dùng ifPresent để an toàn: Nếu user bị xóa DB rồi thì thôi, không cần throw
                        // lỗi
                        userRepository.findByEmail(email).ifPresent(user -> {
                                refreshTokenRedisService.deleteRefreshToken(
                                                refreshToken,
                                                user.getId().toString());
                        });
                }

                // 5. Trả về cookie rỗng
                return cleanCookie;
        }

        public AuthResult handleRefresh(String refreshToken, SessionMetaRequest sessionMetaRequest) {
                // 1. Giải mã token để lấy email (Dùng TokenProvider thay vì gọi trực tiếp
                // JwtDecoder)
                String email = tokenProvider.extractSubject(refreshToken);

                // Nếu không lấy được email (token rác hoặc hết hạn)
                if (email == null) {
                        throw new BadJwtException("Invalid Refresh Token");
                }

                // 2. Tìm User từ DB (Domain Model)
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                String userId = user.getId().toString();

                // 3. Kiểm tra Token có tồn tại trong Redis không (White-list check)
                // Nếu không có trong Redis -> Token này đã bị Logout hoặc bị Xóa trước đó
                if (!refreshTokenRedisService.validateToken(refreshToken, userId)) {
                        throw new BadJwtException("Token invalid or expired");
                }

                // 4. Xóa Token cũ khỏi Redis (Cơ chế Token Rotation - Đổi cũ lấy mới)
                refreshTokenRedisService.deleteRefreshToken(refreshToken, userId);

                // 5. Tạo cặp Token mới (Nhờ TokenProvider làm)
                String newAccessToken = tokenProvider.createAccessToken(user);
                String newRefreshToken = tokenProvider.createRefreshToken(user);
                ResponseCookie newCookie = tokenProvider.buildRefreshCookie(newRefreshToken);

                // 6. Lưu Token mới vào Redis (Gọi hàm save mới đã refactor nhận tham số rời)
                refreshTokenRedisService.saveRefreshToken(
                                newRefreshToken,
                                userId,
                                sessionMetaRequest.getDeviceName(),
                                sessionMetaRequest.getDeviceType(),
                                sessionMetaRequest.getUserAgent(),
                                Duration.ofDays(7) // Hoặc lấy từ biến môi trường config
                );

                // 7. Map sang DTO và trả về kết quả
                UserSessionResponse userDto = mapToUserSessionResponse(user);
                AuthTokenResponse tokenResponse = new AuthTokenResponse(userDto, newAccessToken);

                return new AuthResult(tokenResponse, newCookie);
        }

        public List<SessionMetaResponse> getAllSelfSessionMetas(String refreshToken) {
                // 1. Lấy email từ token (Dùng TokenProvider)
                String email = tokenProvider.extractSubject(refreshToken);
                if (email == null) {
                        return Collections.emptyList(); // Hoặc throw BadJwtException tùy bạn
                }

                // 2. Lấy User Domain
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // 3. Gọi Redis Service để lấy dữ liệu thô (Raw Data)
                List<SessionMeta> rawSessions = refreshTokenRedisService.getAllSessionMetas(user.getId().toString());

                // 4. Tính hash của token hiện tại để so sánh
                // (Logic này trước đây nằm trong RedisService, giờ đưa về Application)
                String currentTokenHash = DigestUtils.sha256Hex(refreshToken);

                // 5. Map từ Raw Model -> DTO Response
                List<SessionMetaResponse> responseList = new ArrayList<>();
                for (SessionMeta meta : rawSessions) {
                        // Redis Key format: "auth::refresh_token:{userId}:{hash}"
                        // Cắt chuỗi để lấy phần hash cuối cùng
                        String keyHash = meta.getSessionId().substring(meta.getSessionId().lastIndexOf(":") + 1);

                        boolean isCurrent = currentTokenHash.equals(keyHash);

                        responseList.add(new SessionMetaResponse(
                                        meta.getSessionId(),
                                        meta.getDeviceName(),
                                        meta.getDeviceType(),
                                        meta.getUserAgent(),
                                        meta.getLoginAt(), // Lưu ý kiểu dữ liệu (Instant hay String) trong DTO
                                        isCurrent));
                }

                return responseList;
        }

        public UserDetailsResponse getCurrentUserDetails() {
                // 1. Lấy email người dùng hiện tại từ Security Context
                String currentUserEmail = SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getName();

                // 2. Tìm User trong DB (Trả về Domain Model)
                User user = userRepository
                                .findByEmail(currentUserEmail)
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // 3. Map Domain -> DTO và trả về
                return mapToUserDetailsResponse(user);
        }

        private UserDetailsResponse mapToUserDetailsResponse(User user) {
                if (user == null)
                        return null;

                // Xử lý Gender: Convert Enum sang String (hoặc null)
                String genderStr = (user.getGender() != null) ? user.getGender().name() : null;

                return UserDetailsResponse.builder()
                                .id(user.getId())
                                .name(user.getUsername()) // Domain là username -> DTO là name
                                .email(user.getEmail())
                                .dob(user.getBirthDate()) // Domain là birthDate -> DTO là dob
                                .address(user.getAddress())
                                .phoneNumber(user.getPhoneNumber())
                                .gender(genderStr) // Enum -> String
                                .logoUrl(user.getLogoUrl())
                                .createdAt(user.getCreatedAt()) // Đã có dữ liệu từ bước trước
                                .updatedAt(user.getUpdatedAt()) // Đã có dữ liệu từ bước trước
                                .build();
        }

        public UserSessionResponse getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                User user = userRepository.findByEmail(authentication.getName())
                                .orElseThrow(() -> new EntityNotFoundException("User not found"));
                return mapToUserSessionResponse(user);
        }

        public void removeSelfSession(String sessionId) {
                // 1. Lấy email người dùng hiện tại
                String currentEmail = SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getName();

                // 2. Lấy User Domain để lấy ID
                User user = userRepository.findByEmail(currentEmail)
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // 3. Validate quyền sở hữu (Delegate cho Redis Service check)
                // Service không cần tự split chuỗi, tránh lỗi ArrayOutOfIndex nếu key sai định
                // dạng
                boolean isOwner = refreshTokenRedisService.isSessionOwner(
                                sessionId,
                                user.getId().toString());

                if (!isOwner) {
                        throw new AccessDeniedException("Không có quyền truy cập session này");
                }

                // 4. Xóa session
                refreshTokenRedisService.deleteRefreshTokenByKey(sessionId);
        }

        public OtpResponse sendOtpForPasswordReset(ForgotPasswordRequest request) {
                // 1. Kiểm tra User tồn tại trong DB (Domain Model)
                // SECURITY FIX: Không throw exception để tránh User Enumeration Attack
                var userOptional = userRepository.findByEmail(request.getEmail());

                // 2. Nếu user KHÔNG tồn tại, vẫn trả về success (generic message)
                // Điều này ngăn hacker dò quét email có trong hệ thống hay không
                if (userOptional.isEmpty()) {
                        log.warn("Forgot password attempt for non-existent email: {}", request.getEmail());
                        // Trả về response giả như đã gửi OTP thành công
                        return new OtpResponse(
                                        true,
                                        "Nếu email này tồn tại trong hệ thống, mã OTP sẽ được gửi đến hộp thư của bạn.",
                                        300L, // 5 phút
                                        3 // Giả lập remaining attempts
                        );
                }

                User user = userOptional.get();

                // 3. Gọi Infra để tạo OTP (Mọi logic validate nằm ẩn bên trong hàm này)
                // Nếu vi phạm rule, Exception sẽ được ném ra từ đây và GlobalExceptionHandler
                // sẽ bắt
                String otp = otpRedisService.generateOtpWithValidation(request.getEmail());

                // 4. Gửi Email (Infra)
                emailService.sendOtpEmail(request.getEmail(), otp, user.getUsername());

                // 5. Lấy thông tin phụ để trả về
                int remainingAttempts = otpRedisService.getRemainingValidationAttempts(request.getEmail());

                return new OtpResponse(
                                true,
                                "Nếu email này tồn tại trong hệ thống, mã OTP sẽ được gửi đến hộp thư của bạn.",
                                300L, // 5 phút
                                remainingAttempts);
        }
        // ... imports

        public OtpResponse resendOtp(ForgotPasswordRequest request) {
                // 1. Kiểm tra User tồn tại (Domain)
                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // 2. Gọi Infra để tạo lại OTP (Logic check rate limit, delete old... nằm trong
                // này)
                // Nếu quá giới hạn gửi, Infra sẽ ném Exception
                String newOtp = otpRedisService.regenerateOtp(request.getEmail());

                // 3. Gửi Email (Infra)
                emailService.sendOtpEmail(request.getEmail(), newOtp, user.getUsername());

                int remainingAttempts = otpRedisService.getRemainingValidationAttempts(request.getEmail());

                // 4. Trả về kết quả
                return new OtpResponse(
                                true,
                                "Mã OTP mới đã được gửi lại thành công.",
                                300L,
                                remainingAttempts);
        }

        public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
                // 1. Kiểm tra User tồn tại
                userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // 2. Kiểm tra OTP (Chỉ check, KHÔNG xóa)
                boolean isValid = otpRedisService.checkOtp(request.getEmail(), request.getOtp());

                String message = isValid
                                ? "Mã OTP hợp lệ."
                                : "Mã OTP không hợp lệ hoặc đã hết hạn.";

                return new VerifyOtpResponse(true, message, isValid);
        }

        @Transactional // Quan trọng: Vì có update DB
        public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
                // 1. Lấy User Domain
                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

                // 2. Xác thực và Tiêu thụ OTP (Nếu sai sẽ ném Exception tại đây)
                otpRedisService.validateAndConsumeOtp(request.getEmail(), request.getOtp());

                // 3. Logic nghiệp vụ: Đổi mật khẩu (Gọi method của Domain Model)
                user.changePassword(new Password(passwordEncoder.encode(request.getNewPassword())));

                // 4. Lưu xuống DB
                userRepository.save(user);

                // 5. Reset Rate Limit (Logic phụ)
                otpRedisService.resetRateLimit(request.getEmail());

                return new ResetPasswordResponse(
                                true,
                                "Mật khẩu đã được đặt lại thành công.");
        }

}
