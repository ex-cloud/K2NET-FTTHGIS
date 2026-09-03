package com.company.ftthgis.domain.tenant.service;

import com.company.ftthgis.api.exception.ActiveSessionConflictException;
import com.company.ftthgis.api.exception.InvalidImpersonationSessionException;
import com.company.ftthgis.api.exception.StepUpAuthRequiredException;
import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.domain.tenant.dto.ImpersonationExchangeCache;
import com.company.ftthgis.domain.tenant.dto.ImpersonationSessionCache;
import com.company.ftthgis.domain.tenant.entity.ImpersonationSession;
import com.company.ftthgis.domain.tenant.entity.ImpersonationStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.ImpersonationSessionRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImpersonationService {

    private static final String SESSION_CACHE_PREFIX = "impersonation:session:";
    private static final String EXCHANGE_CACHE_PREFIX = "impersonation:exchange:";
    private static final long SESSION_TTL_SECONDS = 1800; // 30 minutes
    private static final long EXCHANGE_CODE_TTL_SECONDS = 60; // 60 seconds single-use
    private static final long STEP_UP_MAX_AGE_SECONDS = 120; // 2 minutes max age for re-auth

    private final ImpersonationSessionRepository impersonationSessionRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditLoggingService auditLoggingService;
    private final ObjectMapper objectMapper;

    @Value("${keycloak.internal-url:http://localhost:8081}")
    private String keycloakInternalUrl;

    @Value("${app.security.keycloak.provision-client-id:ftth-gis-frontend}")
    private String keycloakClientId;

    /**
     * Start an impersonation session for the given target tenant.
     * Accepts either UUID string or organization slug.
     * Enforces Step-Up MFA freshness (auth_time <= 120s) and single active session per actor.
     */
    @Transactional
    public ImpersonationSessionResponse startSession(String tenantIdentifier, ImpersonationStartRequest request, Jwt jwt) {
        UUID actorUserId = UUID.fromString(jwt.getSubject());

        // 1. Validasi kesegaran re-autentikasi (Step-Up MFA)
        long authTimeEpoch;
        Object authTimeClaim = jwt.getClaim("auth_time");
        if (authTimeClaim instanceof Instant instant) {
            authTimeEpoch = instant.getEpochSecond();
        } else if (authTimeClaim instanceof Number num) {
            authTimeEpoch = num.longValue();
        } else if (jwt.getIssuedAt() != null) {
            authTimeEpoch = jwt.getIssuedAt().getEpochSecond();
        } else {
            throw new StepUpAuthRequiredException("Klaim auth_time/iat tidak ditemukan pada token. Lakukan re-autentikasi (Step-Up MFA).");
        }

        long currentEpoch = Instant.now().getEpochSecond();
        if (currentEpoch - authTimeEpoch > STEP_UP_MAX_AGE_SECONDS) {
            throw new StepUpAuthRequiredException("Sesi otentikasi telah melebihi 120 detik. Lakukan re-autentikasi (Step-Up MFA) untuk melanjutkan.");
        }

        // 2. Validasi aktor dan tenant target (fleksibel: bisa UUID atau slug)
        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new NoSuchElementException("Pengguna Super Admin tidak ditemukan"));

        Organization targetOrg;
        try {
            UUID id = UUID.fromString(tenantIdentifier);
            targetOrg = organizationRepository.findById(id)
                    .orElseGet(() -> organizationRepository.findBySlug(tenantIdentifier)
                            .orElseThrow(() -> new NoSuchElementException("Tenant target tidak ditemukan: " + tenantIdentifier)));
        } catch (IllegalArgumentException e) {
            targetOrg = organizationRepository.findBySlug(tenantIdentifier)
                    .orElseThrow(() -> new NoSuchElementException("Tenant target tidak ditemukan: " + tenantIdentifier));
        }

        // 3. Pencegahan sesi ganda (TOLAK HTTP 409 Conflict, tidak auto-revoke)
        Optional<ImpersonationSession> activeSessionOpt = impersonationSessionRepository.findActiveSessionByActorId(actor.getId());
        if (activeSessionOpt.isPresent()) {
            ImpersonationSession existing = activeSessionOpt.get();
            if (existing.getExpiresAt().isBefore(Instant.now())) {
                existing.setStatus(ImpersonationStatus.EXPIRED);
                impersonationSessionRepository.save(existing);
            } else {
                String existingOrgName = existing.getTargetOrganization() != null ? existing.getTargetOrganization().getName() : "tenant lain";
                throw new ActiveSessionConflictException("Anda masih memiliki sesi impersonasi aktif untuk tenant '" + existingOrgName + "'. Silakan keluar terlebih dahulu sebelum memulai sesi baru.");
            }
        }

        // 4. Buat dan simpan sesi di PostgreSQL
        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofSeconds(SESSION_TTL_SECONDS));
        Instant stepUpVerifiedAt = Instant.ofEpochSecond(authTimeEpoch);

        ImpersonationSession session = ImpersonationSession.builder()
                .actorUser(actor)
                .targetOrganization(targetOrg)
                .reason(request.getReason())
                .ticketReference(request.getTicketReference())
                .stepUpVerifiedAt(stepUpVerifiedAt)
                .startedAt(now)
                .expiresAt(expiresAt)
                .status(ImpersonationStatus.ACTIVE)
                .createdAt(now)
                .build();

        session = impersonationSessionRepository.save(session);

        // 5. Generate one-time exchange code (64-char hex)
        String exchangeCode = generateSecureHex(32);

        // 6. Simpan sesi ke Redis
        ImpersonationSessionCache sessionCache = ImpersonationSessionCache.builder()
                .sessionId(session.getId())
                .actorId(actor.getId())
                .targetTenantId(targetOrg.getId())
                .targetTenantSlug(targetOrg.getSlug())
                .targetTenantName(targetOrg.getName())
                .refreshToken(request.getRefreshToken())
                .expiresAt(expiresAt.toString())
                .build();

        redisTemplate.opsForValue().set(
                SESSION_CACHE_PREFIX + session.getId(),
                sessionCache,
                SESSION_TTL_SECONDS,
                TimeUnit.SECONDS
        );

        // 7. Simpan exchange code ke Redis (single-use, TTL 60 detik)
        ImpersonationExchangeCache exchangeCache = ImpersonationExchangeCache.builder()
                .sessionId(session.getId())
                .actorId(actor.getId())
                .targetTenantId(targetOrg.getId())
                .targetTenantSlug(targetOrg.getSlug())
                .targetTenantName(targetOrg.getName())
                .accessToken(jwt.getTokenValue())
                .expiresInSeconds(SESSION_TTL_SECONDS)
                .expiresAt(expiresAt.toString())
                .build();

        redisTemplate.opsForValue().set(
                EXCHANGE_CACHE_PREFIX + exchangeCode,
                exchangeCache,
                EXCHANGE_CODE_TTL_SECONDS,
                TimeUnit.SECONDS
        );

        // 8. Catat audit event eksplisit saat sesi dimulai (lengkap dengan reason, ticket, UUID)
        Map<String, Object> auditMetadata = new HashMap<>();
        auditMetadata.put("reason", request.getReason());
        auditMetadata.put("ticketReference", request.getTicketReference() != null ? request.getTicketReference() : "");
        auditMetadata.put("actorEmail", actor.getEmail());
        auditMetadata.put("actorUuid", actor.getId().toString());
        auditMetadata.put("targetOrgId", targetOrg.getId().toString());
        auditMetadata.put("targetOrgSlug", targetOrg.getSlug());
        auditMetadata.put("expiresAt", expiresAt.toString());
        auditMetadata.put("initiatedBy", actor.getEmail());

        auditLoggingService.logEvent(
                targetOrg.getSlug(),
                "IMPERSONATION_STARTED",
                "IMPERSONATION_SESSION",
                session.getId().toString(),
                null,
                auditMetadata,
                auditMetadata
        );

        log.info("🛡️ [Impersonation] Sesi impersonasi aktif dimulai: actor={}, targetTenant={}, sessionId={}",
                actor.getEmail(), targetOrg.getSlug(), session.getId());

        return ImpersonationSessionResponse.builder()
                .sessionId(session.getId())
                .exchangeCode(exchangeCode)
                .targetTenantId(targetOrg.getId())
                .targetTenantSlug(targetOrg.getSlug())
                .targetTenantName(targetOrg.getName())
                .expiresAt(expiresAt)
                .build();
    }

    @Transactional
    public ImpersonationSessionResponse startSession(UUID targetTenantId, ImpersonationStartRequest request, Jwt jwt) {
        return startSession(targetTenantId.toString(), request, jwt);
    }

    /**
     * Exchange a single-use exchange code for impersonation session details and active token.
     * Code is immediately deleted from Redis upon retrieval.
     */
    public ImpersonationExchangeResponse exchangeCode(String code) {
        String exchangeKey = EXCHANGE_CACHE_PREFIX + code;
        Object cached = redisTemplate.opsForValue().get(exchangeKey);

        if (cached == null) {
            throw new IllegalArgumentException("Kode penukaran impersonasi tidak valid atau sudah kedaluwarsa.");
        }

        // Hapus kode segera (single-use guarantee)
        redisTemplate.delete(exchangeKey);

        ImpersonationExchangeCache cache = objectMapper.convertValue(cached, ImpersonationExchangeCache.class);

        return ImpersonationExchangeResponse.builder()
                .sessionId(cache.getSessionId())
                .token(cache.getAccessToken())
                .targetTenantId(cache.getTargetTenantId())
                .targetTenantSlug(cache.getTargetTenantSlug())
                .targetTenantName(cache.getTargetTenantName())
                .expiresInSeconds(cache.getExpiresInSeconds())
                .expiresAt(cache.getExpiresAt() != null ? Instant.parse(cache.getExpiresAt()) : null)
                .build();
    }

    /**
     * Server-Side Refresh Relay:
     * Refreshes the Super Admin token using the stored refresh token in Redis against Keycloak,
     * without exposing the refresh token to the browser tenant portal.
     */
    @SuppressWarnings("unchecked")
    public ImpersonationRefreshResponse refreshToken(UUID sessionId) {
        String sessionKey = SESSION_CACHE_PREFIX + sessionId;
        Object cached = redisTemplate.opsForValue().get(sessionKey);

        if (cached == null) {
            throw new InvalidImpersonationSessionException("Sesi impersonasi telah kedaluwarsa atau tidak valid.");
        }

        ImpersonationSessionCache sessionCache = objectMapper.convertValue(cached, ImpersonationSessionCache.class);

        if (sessionCache.getRefreshToken() == null || sessionCache.getRefreshToken().isBlank()) {
            throw new InvalidImpersonationSessionException("Refresh token tidak tersedia pada sesi impersonasi ini.");
        }

        // Call Keycloak Token Endpoint
        try {
            String tokenUrl = keycloakInternalUrl + "/realms/ftth-realm/protocol/openid-connect/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "refresh_token");
            body.add("client_id", keycloakClientId);
            body.add("refresh_token", sessionCache.getRefreshToken());

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> respMap = response.getBody();
                String newAccessToken = (String) respMap.get("access_token");
                String newRefreshToken = (String) respMap.get("refresh_token");
                Number expiresIn = (Number) respMap.get("expires_in");

                // Update rotated refresh token in Redis if provided
                if (newRefreshToken != null && !newRefreshToken.isBlank()) {
                    sessionCache.setRefreshToken(newRefreshToken);
                    Long ttl = redisTemplate.getExpire(sessionKey, TimeUnit.SECONDS);
                    if (ttl != null && ttl > 0) {
                        redisTemplate.opsForValue().set(sessionKey, sessionCache, ttl, TimeUnit.SECONDS);
                    }
                }

                log.info("🛡️ [Impersonation] Token refreshed successfully for session: {}", sessionId);
                return ImpersonationRefreshResponse.builder()
                        .accessToken(newAccessToken)
                        .expiresInSeconds(expiresIn != null ? expiresIn.longValue() : 1800)
                        .build();
            } else {
                throw new InvalidImpersonationSessionException("Gagal merefresh token melalui Keycloak.");
            }
        } catch (Exception ex) {
            log.warn("🛡️ [Impersonation] Gagal merefresh token untuk sesi {}: {}", sessionId, ex.getMessage());
            throw new InvalidImpersonationSessionException("Sesi otentikasi Keycloak telah kedaluwarsa atau dibatalkan.");
        }
    }

    /**
     * Terminate an active impersonation session.
     */
    @Transactional
    public void exitSession(UUID sessionId, UUID callerUserId) {
        ImpersonationSession session = impersonationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Sesi impersonasi tidak ditemukan"));

        if (!session.getActorUser().getId().equals(callerUserId)) {
            throw new IllegalArgumentException("Hanya Super Admin pembuat sesi yang dapat mengakhiri sesi ini.");
        }

        session.setStatus(ImpersonationStatus.REVOKED);
        session.setRevokedAt(Instant.now());
        impersonationSessionRepository.save(session);

        // Hapus dari Redis
        redisTemplate.delete(SESSION_CACHE_PREFIX + sessionId);

        // Catat audit event eksplisit saat sesi berakhir (lengkap dengan durasi, actor, UUID)
        long durationSeconds = Duration.between(session.getStartedAt(), Instant.now()).toSeconds();
        Map<String, Object> auditMetadata = new HashMap<>();
        auditMetadata.put("durationSeconds", durationSeconds);
        auditMetadata.put("revokedAt", session.getRevokedAt().toString());
        auditMetadata.put("endedBy", session.getActorUser().getEmail());
        auditMetadata.put("actorUuid", session.getActorUser().getId().toString());
        auditMetadata.put("targetOrgSlug", session.getTargetOrganization().getSlug());

        auditLoggingService.logEvent(
                session.getTargetOrganization().getSlug(),
                "IMPERSONATION_ENDED",
                "IMPERSONATION_SESSION",
                sessionId.toString(),
                null,
                auditMetadata,
                auditMetadata
        );

        log.info("🛡️ [Impersonation] Sesi impersonasi diakhiri: sessionId={}, duration={}s", sessionId, durationSeconds);
    }

    /**
     * Terminate currently active impersonation session for the actor if any.
     */
    @Transactional
    public void exitActiveSessionForActor(UUID actorUserId) {
        impersonationSessionRepository.findActiveSessionByActorId(actorUserId)
                .ifPresent(session -> exitSession(session.getId(), actorUserId));
    }

    /**
     * Get active impersonation session info for the actor.
     */
    public Map<String, Object> getActiveSessionForActor(UUID actorUserId) {
        return impersonationSessionRepository.findActiveSessionByActorId(actorUserId)
                .map(session -> {
                    long remaining = Math.max(Duration.between(Instant.now(), session.getExpiresAt()).toSeconds(), 0);
                    Map<String, Object> map = new HashMap<>();
                    map.put("hasActiveSession", true);
                    map.put("sessionId", session.getId().toString());
                    map.put("targetOrgId", session.getTargetOrganization().getId().toString());
                    map.put("targetOrgSlug", session.getTargetOrganization().getSlug());
                    map.put("targetOrgName", session.getTargetOrganization().getName());
                    map.put("startedAt", session.getStartedAt().toString());
                    map.put("expiresAt", session.getExpiresAt().toString());
                    map.put("remainingSeconds", remaining);
                    return map;
                })
                .orElseGet(() -> Map.of("hasActiveSession", false));
    }

    /**
     * Check status and remaining TTL for an impersonation session.
     */
    public ImpersonationStatusResponse getStatus(UUID sessionId) {
        String sessionKey = SESSION_CACHE_PREFIX + sessionId;
        Object cached = redisTemplate.opsForValue().get(sessionKey);

        if (cached == null) {
            return ImpersonationStatusResponse.builder()
                    .active(false)
                    .sessionId(sessionId)
                    .remainingSeconds(0)
                    .build();
        }

        ImpersonationSessionCache cache = objectMapper.convertValue(cached, ImpersonationSessionCache.class);
        Long ttl = redisTemplate.getExpire(sessionKey, TimeUnit.SECONDS);

        return ImpersonationStatusResponse.builder()
                .active(true)
                .sessionId(sessionId)
                .targetTenantId(cache.getTargetTenantId())
                .targetTenantSlug(cache.getTargetTenantSlug())
                .targetTenantName(cache.getTargetTenantName())
                .remainingSeconds(ttl != null && ttl > 0 ? ttl : 0)
                .expiresAt(cache.getExpiresAt() != null ? Instant.parse(cache.getExpiresAt()) : null)
                .build();
    }

    private String generateSecureHex(int numBytes) {
        byte[] bytes = new byte[numBytes];
        new SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
