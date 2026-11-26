package com.company.ftthgis.service.scim;

import com.company.ftthgis.api.scim.dto.ScimAdminDtos.*;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroup;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimToken;
import com.company.ftthgis.domain.tenant.repository.*;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.util.SecretEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * Manages Enterprise SCIM 2.0 Bearer Tokens (SHA-256 prefix-indexed) and SCIM Group-to-Role mappings
 * per organization tenant (ADR-0029).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScimTokenService {

    public static final String TOKEN_PREFIX_MARKER = "k2_scim_";

    private final OrganizationRepository organizationRepository;
    private final OrganizationScimTokenRepository scimTokenRepository;
    private final OrganizationScimGroupRepository scimGroupRepository;
    private final OrganizationScimGroupMemberRepository scimGroupMemberRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final RoleRepository roleRepository;
    private final SecretEncryptionUtil encryptionUtil;
    private final AuditLoggingService auditLoggingService;

    @Value("${app.base-domain:kdua.net}")
    private String baseDomain;

    @Transactional(readOnly = true)
    public ScimSummaryResponse getSummary(String orgSlug) {
        Organization org = resolveOrg(orgSlug);
        List<OrganizationScimToken> tokens = scimTokenRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId());
        List<OrganizationScimGroup> groups = scimGroupRepository.findByOrganizationIdOrderByDisplayNameAsc(org.getId());
        List<Role> tenantRoles = roleRepository.findAvailableRolesForTenant(org.getId()).stream()
                .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                .toList();

        long activeTokens = tokens.stream()
                .filter(t -> t.isActive() && t.getRevokedAt() == null
                        && (t.getExpiresAt() == null || t.getExpiresAt().isAfter(OffsetDateTime.now())))
                .count();
        long scimManagedUsers = organizationMemberRepository.countByOrganizationIdAndScimManagedTrue(org.getId());

        String scimBaseUrl = "https://" + org.getSlug() + "." + baseDomain + "/api/v1/scim/v2/" + org.getSlug();

        return ScimSummaryResponse.builder()
                .organizationSlug(org.getSlug())
                .scimBaseUrl(scimBaseUrl)
                .activeTokensCount(activeTokens)
                .scimManagedUsersCount(scimManagedUsers)
                .syncedGroupsCount(groups.size())
                .tokens(tokens.stream().map(this::toTokenDto).toList())
                .groups(groups.stream().map(g -> toGroupDto(g, scimGroupMemberRepository.countByGroupId(g.getId()))).toList())
                .availableRoles(tenantRoles.stream().map(r -> ScimRoleOptionDto.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .displayName(r.getDisplayName() != null ? r.getDisplayName() : r.getName())
                        .code(r.getCode())
                        .build()).toList())
                .build();
    }

    @Transactional
    public CreateScimTokenResponse createToken(String orgSlug, CreateScimTokenRequest request, String actor) {
        Organization org = resolveOrg(orgSlug);
        String name = request != null && request.getName() != null ? request.getName().trim() : "";
        if (name.isBlank()) {
            throw new IllegalArgumentException("Nama SCIM Bearer Token tidak boleh kosong.");
        }
        if (name.length() > 120) {
            throw new IllegalArgumentException("Nama SCIM Bearer Token maksimal 120 karakter.");
        }

        String prefixEntropy = encryptionUtil.generateSecureToken(4); // 8 hex chars
        String secretEntropy = encryptionUtil.generateSecureToken(32); // 64 hex chars (256-bit)
        String tokenPrefix = TOKEN_PREFIX_MARKER + prefixEntropy;
        String plainTextToken = tokenPrefix + "_" + secretEntropy;
        String tokenHash = encryptionUtil.sha256Hex(plainTextToken);

        OffsetDateTime expiresAt = null;
        if (request.getExpirationDays() != null && request.getExpirationDays() > 0) {
            expiresAt = OffsetDateTime.now().plusDays(Math.min(request.getExpirationDays(), 1095));
        }

        OrganizationScimToken entity = OrganizationScimToken.builder()
                .organization(org)
                .name(name)
                .tokenPrefix(tokenPrefix)
                .tokenHash(tokenHash)
                .isActive(true)
                .expiresAt(expiresAt)
                .build();

        OrganizationScimToken saved = scimTokenRepository.save(entity);
        emitAudit(org.getSlug(), "SCIM_TOKEN_CREATED", saved.getId().toString(),
                Map.of("name", name, "prefix", tokenPrefix), actor);
        log.info("🔑 SCIM Bearer Token '{}' ({}) created for org '{}' by '{}'", name, tokenPrefix, org.getSlug(), actor);

        return CreateScimTokenResponse.builder()
                .token(toTokenDto(saved))
                .plainTextToken(plainTextToken)
                .build();
    }

    @Transactional
    public void revokeToken(String orgSlug, UUID tokenId, String actor) {
        Organization org = resolveOrg(orgSlug);
        OrganizationScimToken token = scimTokenRepository.findByIdAndOrganizationId(tokenId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SCIM token not found: " + tokenId));

        token.setActive(false);
        token.setRevokedAt(OffsetDateTime.now());
        token.setRevokedBy(actor != null ? actor : "system");
        scimTokenRepository.save(token);

        emitAudit(org.getSlug(), "SCIM_TOKEN_REVOKED", token.getId().toString(),
                Map.of("name", token.getName(), "prefix", token.getTokenPrefix()), actor);
        log.info("🔒 SCIM Bearer Token '{}' ({}) revoked for org '{}' by '{}'",
                token.getName(), token.getTokenPrefix(), org.getSlug(), actor);
    }

    @Transactional
    public ScimGroupMappingDto updateGroupRoleMapping(String orgSlug, UUID groupId, String rawRoleName, String actor) {
        Organization org = resolveOrg(orgSlug);
        OrganizationScimGroup group = scimGroupRepository.findByIdAndOrganizationId(groupId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SCIM group not found: " + groupId));

        if (rawRoleName == null || rawRoleName.isBlank()) {
            group.setMappedRole(null);
            group.setMappedRoleName(null);
        } else {
            String normalized = rawRoleName.trim().toLowerCase(Locale.ROOT);
            Role tenantRole = roleRepository.findByNameAndOrganizationId(normalized, org.getId())
                    .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                    .or(() -> roleRepository.findByNameAndScopeAndOrganizationIsNull(normalized, "TENANT"))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Role '" + rawRoleName + "' tidak valid atau tidak berada pada scope TENANT."));
            group.setMappedRole(tenantRole);
            group.setMappedRoleName(tenantRole.getName());
        }

        OrganizationScimGroup saved = scimGroupRepository.save(group);
        emitAudit(org.getSlug(), "SCIM_GROUP_ROLE_MAPPED", saved.getId().toString(),
                Map.of("displayName", saved.getDisplayName(),
                        "mappedRole", saved.getMappedRoleName() != null ? saved.getMappedRoleName() : "NONE"),
                actor);

        long count = scimGroupMemberRepository.countByGroupId(saved.getId());
        return toGroupDto(saved, count);
    }

    @Transactional
    public void deleteGroup(String orgSlug, UUID groupId, String actor) {
        Organization org = resolveOrg(orgSlug);
        OrganizationScimGroup group = scimGroupRepository.findByIdAndOrganizationId(groupId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SCIM group not found: " + groupId));
        scimGroupMemberRepository.deleteByGroupId(group.getId());
        scimGroupRepository.delete(group);
        emitAudit(org.getSlug(), "SCIM_GROUP_DELETED", groupId.toString(),
                Map.of("displayName", group.getDisplayName()), actor);
    }

    private Organization resolveOrg(String orgSlug) {
        if (orgSlug == null || orgSlug.isBlank()) {
            throw new IllegalArgumentException("Slug organisasi tidak boleh kosong.");
        }
        return organizationRepository.findBySlug(orgSlug.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgSlug));
    }

    private ScimTokenDto toTokenDto(OrganizationScimToken t) {
        boolean effectivelyActive = t.isActive() && t.getRevokedAt() == null
                && (t.getExpiresAt() == null || t.getExpiresAt().isAfter(OffsetDateTime.now()));
        return ScimTokenDto.builder()
                .id(t.getId())
                .name(t.getName())
                .tokenPrefix(t.getTokenPrefix())
                .maskedToken(t.getTokenPrefix() + "_••••••••")
                .active(effectivelyActive)
                .expiresAt(t.getExpiresAt())
                .lastUsedAt(t.getLastUsedAt())
                .lastUsedIp(t.getLastUsedIp())
                .revokedAt(t.getRevokedAt())
                .revokedBy(t.getRevokedBy())
                .createdAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null)
                .createdBy(t.getCreatedBy())
                .build();
    }

    private ScimGroupMappingDto toGroupDto(OrganizationScimGroup g, long memberCount) {
        Role r = g.getMappedRole();
        return ScimGroupMappingDto.builder()
                .id(g.getId())
                .displayName(g.getDisplayName())
                .externalId(g.getExternalId())
                .mappedRoleId(r != null ? r.getId() : null)
                .mappedRoleName(g.getMappedRoleName() != null ? g.getMappedRoleName() : (r != null ? r.getName() : null))
                .mappedRoleDisplayName(r != null ? r.getDisplayName() : g.getMappedRoleName())
                .memberCount(memberCount)
                .updatedAt(g.getUpdatedAt() != null ? g.getUpdatedAt().toString() : null)
                .build();
    }

    private void emitAudit(String tenantSlug, String action, String resourceId, Map<String, Object> details, String actor) {
        try {
            auditLoggingService.logEvent(
                    tenantSlug,
                    action,
                    "SCIM_PROVISIONING",
                    resourceId,
                    null,
                    details,
                    Map.of("actor", actor != null ? actor : "system", "source", "TENANT_ADMIN")
            );
        } catch (Exception e) {
            log.debug("Non-fatal: failed writing SCIM admin audit log {}: {}", action, e.getMessage());
        }
    }
}
