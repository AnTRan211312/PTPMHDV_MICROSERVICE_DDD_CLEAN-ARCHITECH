package com.tranan.authservice.infrastructure.config.network;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SessionMeta implements Serializable {
    private String sessionId;
    private String deviceName;
    private String deviceType;
    private String userAgent;
    private Instant loginAt;
}
