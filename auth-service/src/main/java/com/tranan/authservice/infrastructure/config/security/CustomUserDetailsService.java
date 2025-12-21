package com.tranan.authservice.infrastructure.config.security;

import com.tranan.authservice.domain.model.User; // Import User của Domain
import com.tranan.authservice.domain.repository.UserRepository; // Import Repo của Domain
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    // 1. Inject Interface của Domain (Không dùng JpaRepository trực tiếp)
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // 2. Gọi Domain Repository để lấy User
        // (Bên dưới nó sẽ tự chạy xuống Infra -> JPA -> Mapper -> Domain)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // 3. Lấy permissions từ role
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
        if (user.getRole() != null && user.getRole().getPermissions() != null) {
            authorities = user.getRole().getPermissions().stream()
                    .map(p -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                            p.getMethod() + " " + p.getApiPath()
                    ))
                    .collect(java.util.stream.Collectors.toList());
        }

        // 4. Map sang đối tượng User của Spring Security
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword().getValue())
                .authorities(authorities)
                .build();
    }
}