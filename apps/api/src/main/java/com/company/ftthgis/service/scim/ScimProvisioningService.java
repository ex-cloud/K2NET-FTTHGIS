package com.company.ftthgis.service.scim;

import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroup;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroupMember;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationScimGroupMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationScimGroupRepository;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.KeycloakAdminService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Core Enterprise SCIM 2.0 Server Engine (RFC 7643 & RFC 7644 / ADR-0029).
 *
 * <p>Implements Okta & Microsoft Entra ID compatible User & Group lifecycle operations,
 * Group-to-Role automatic reconciliation (strictly TENANT scope Air-Gap), Last Admin
 * anti-lockout protection, Multi-Workspace (1 User -> N Orgs) safety, and Zero-Window
 * Instant Offboarding via Keycloak session logout + account disable + Redis elevation purge.
 */
@Service
@Slf4j
public class ScimProvisioningService {

    private static final String SCIM_LIST_RESPONSE_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
    private static final String SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
    private static final String SCIM_GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group";
    private static final String SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA =
            "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig";
    private static final String SCIM_RESOURCE_TYPE_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:ResourceType";

    private static final Pattern FILTER_EQ_PATTERN = Pattern.compile(
            "^\\s*([a-zA-Z0-9_.]+)\\s+eq\\s+\"([^\"]*)\"\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern MEMBER_PATH_FILTER_PATTERN = Pattern.compile(
            "^members\\[\\s*value\\s+eq\\s+\"([^\"]+)\"\\s*]$", Pattern.CASE_INSENSITIVE);

    private static final Map<String, Integer> ROLE_RANK = Map.of(
            "admin", 100,
            "noc", 80,
            "technician", 60,
            "viewer", 10
    );

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationMemberRepository memberRepository;
    private final OrganizationScimGroupRepository groupRepository;
    private final OrganizationScimGroupMemberRepository groupMemberRepository;
    private final RoleRepository roleRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final AuditLoggingService auditLoggingService;
    private final StringRedisTemplate redisTemplate;

    public ScimProvisioningService(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            OrganizationMemberRepository memberRepository,
            OrganizationScimGroupRepository groupRepository,
            OrganizationScimGroupMemberRepository groupMemberRepository,
            RoleRepository roleRepository,
            KeycloakAdminService keycloakAdminService,
            AuditLoggingService auditLoggingService,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.roleRepository = roleRepository;
        this.keycloakAdminService = keycloakAdminService;
        this.auditLoggingService = auditLoggingService;
        this.redisTemplate = redisTemplate;
    }

    // -------------------------------------------------------------------------
    // Discovery Metadata Endpoints (RFC 7644 §4)
    // -------------------------------------------------------------------------

    public Map<String, Object> getServiceProviderConfig(String orgSlug) {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("schemas", List.of(SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA));
        cfg.put("documentationUri", "https://docs.kdua.net/enterprise-scim");
        cfg.put("patch", Map.of("supported", true));
        cfg.put("bulk", Map.of("supported", false, "maxOperations", 0, "maxPayloadSize", 0));
        cfg.put("filter", Map.of("supported", true, "maxResults", 200));
        cfg.put("changePassword", Map.of("supported", false));
        cfg.put("sort", Map.of("supported", false));
        cfg.put("etag", Map.of("supported", false));
        cfg.put("authenticationSchemes", List.of(Map.of(
                "type", "oauthbearertoken",
                "name", "OAuth Bearer Token",
                "description", "Authentication scheme using K2NET Tenant Scoped SCIM Bearer Token (k2_scim_...)",
                "specUri", "http://www.rfc-editor.org/info/rfc6750",
                "primary", true
        )));
        cfg.put("meta", Map.of(
                "resourceType", "ServiceProviderConfig",
                "location", "/api/v1/scim/v2/" + orgSlug + "/ServiceProviderConfig"
        ));
        return cfg;
    }

    public Map<String, Object> getResourceTypes(String orgSlug) {
        List<Map<String, Object>> resources = List.of(
                Map.of(
                        "schemas", List.of(SCIM_RESOURCE_TYPE_SCHEMA),
                        "id", "User",
                        "name", "User",
                        "endpoint", "/Users",
                        "description", "K2NET Tenant Workspace Member User",
                        "schema", SCIM_USER_SCHEMA,
                        "meta", Map.of(
                                "resourceType", "ResourceType",
                                "location", "/api/v1/scim/v2/" + orgSlug + "/ResourceTypes/User"
                        )
                ),
                Map.of(
                        "schemas", List.of(SCIM_RESOURCE_TYPE_SCHEMA),
                        "id", "Group",
                        "name", "Group",
                        "endpoint", "/Groups",
                        "description", "K2NET SCIM Role Mapping Group",
                        "schema", SCIM_GROUP_SCHEMA,
                        "meta", Map.of(
                                "resourceType", "ResourceType",
                                "location", "/api/v1/scim/v2/" + orgSlug + "/ResourceTypes/Group"
                        )
                )
        );
        return buildListResponse(resources, resources.size(), 1);
    }

    public Map<String, Object> getSchemas() {
        List<Map<String, Object>> schemas = List.of(
                Map.of("id", SCIM_USER_SCHEMA, "name", "User", "description", "Core SCIM 2.0 User"),
                Map.of("id", SCIM_GROUP_SCHEMA, "name", "Group", "description", "Core SCIM 2.0 Group")
        );
        return buildListResponse(schemas, schemas.size(), 1);
    }

    // -------------------------------------------------------------------------
    // /Users Operations
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Map<String, Object> listUsers(String orgSlug, String filter, int startIndex, int count) {
        Organization org = resolveOrg(orgSlug);
        List<OrganizationMember> members = memberRepository.findAllMembersByOrganizationId(org.getId());

        List<OrganizationMember> filtered = members;
        if (filter != null && !filter.isBlank()) {
            Matcher m = FILTER_EQ_PATTERN.matcher(filter);
            if (!m.matches()) {
                throw new ScimException(HttpStatus.BAD_REQUEST, "invalidFilter",
                        "Unsupported filter syntax. Supported filters: userName eq \"...\", externalId eq \"...\", emails.value eq \"...\".");
            }
            String attr = m.group(1).toLowerCase(Locale.ROOT);
            String target = m.group(2).trim();
            filtered = members.stream().filter(om -> {
                User u = om.getUser();
                return switch (attr) {
                    case "username" -> u != null && ((u.getUsername() != null && u.getUsername().equalsIgnoreCase(target))
                            || (u.getEmail() != null && u.getEmail().equalsIgnoreCase(target)));
                    case "emails.value", "email" -> u != null && u.getEmail() != null && u.getEmail().equalsIgnoreCase(target);
                    case "externalid" -> om.getScimExternalId() != null && om.getScimExternalId().equalsIgnoreCase(target);
                    default -> throw new ScimException(HttpStatus.BAD_REQUEST, "invalidFilter",
                            "Unsupported filter attribute: " + attr);
                };
            }).toList();
        }

        List<Map<String, Object>> allResources = filtered.stream()
                .map(om -> toScimUser(org.getSlug(), om))
                .toList();

        return paginateResources(allResources, startIndex, count);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUser(String orgSlug, String userIdRaw) {
        Organization org = resolveOrg(orgSlug);
        UUID userId = parseUuid(userIdRaw, "Invalid SCIM User ID format: " + userIdRaw);
        OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(userId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "User not found in organization."));
        return toScimUser(org.getSlug(), member);
    }

    @Transactional
    public Map<String, Object> createUser(String orgSlug, Map<String, Object> payload, String actor) {
        Organization org = resolveOrg(orgSlug);
        if (payload == null) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidSyntax", "Request payload cannot be empty.");
        }

        String email = extractPrimaryEmail(payload);
        String userName = asString(payload.get("userName"));
        if ((email == null || email.isBlank()) && userName != null && userName.contains("@")) {
            email = userName.trim().toLowerCase(Locale.ROOT);
        }
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidValue",
                    "A valid email address (userName or emails[].value) is required.");
        }
        email = email.trim().toLowerCase(Locale.ROOT);
        String effectiveUsername = (userName != null && !userName.isBlank()) ? userName.trim() : email;

        NameParts nameParts = extractNameParts(payload, email);
        String externalId = trimToNull(asString(payload.get("externalId")));
        String phone = extractPrimaryPhone(payload);
        String title = trimToNull(asString(payload.get("title")));
        boolean active = extractActiveFlag(payload, true);

        Optional<User> existingUserOpt = userRepository.findByEmailGlobal(email);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            Optional<OrganizationMember> existingMemberOpt =
                    memberRepository.findByUserIdAndOrganizationId(existingUser.getId(), org.getId());

            if (existingMemberOpt.isPresent()) {
                OrganizationMember existingMember = existingMemberOpt.get();
                if ("ACTIVE".equalsIgnoreCase(existingMember.getStatus()) && active) {
                    throw new ScimException(HttpStatus.CONFLICT, "uniqueness",
                            "User '" + email + "' is already an active member of organization '" + org.getSlug() + "'.");
                }
                applyProfileUpdatesToUser(existingUser, nameParts.fullName(), phone, title, effectiveUsername);
                existingUser.setStatus(active ? "ACTIVE" : resolveGlobalStatusAfterOrgChange(existingUser, org.getId(), false));
                if (existingUser.getOrganization() == null) {
                    existingUser.setOrganization(org);
                }
                userRepository.save(existingUser);

                existingMember.setStatus(active ? "ACTIVE" : "SUSPENDED");
                existingMember.setScimManaged(true);
                if (externalId != null) {
                    existingMember.setScimExternalId(externalId);
                }
                if (active && existingMember.getJoinedAt() == null) {
                    existingMember.setJoinedAt(LocalDateTime.now());
                }
                existingMember.setInvitationToken(null);
                existingMember.setInvitationExpiresAt(null);
                OrganizationMember savedMember = memberRepository.save(existingMember);

                syncKeycloakAccountState(existingUser, nameParts, savedMember.getRoleName(), active);
                if (!active) {
                    purgeUserAuthCacheAndSessions(existingUser);
                }

                emitScimAudit(org.getSlug(), "SCIM_USER_PROVISIONED", existingUser.getId().toString(),
                        Map.of("email", email, "action", "reactivated_or_updated", "active", active), actor);
                return toScimUser(org.getSlug(), savedMember);
            }

            // Existing global user joining another workspace via SCIM
            Role defaultRole = resolveDefaultTenantRole(org.getId());
            applyProfileUpdatesToUser(existingUser, nameParts.fullName(), phone, title, effectiveUsername);
            if (active && !"ACTIVE".equalsIgnoreCase(existingUser.getStatus())) {
                existingUser.setStatus("ACTIVE");
            }
            if (existingUser.getOrganization() == null) {
                existingUser.setOrganization(org);
            }
            userRepository.save(existingUser);

            OrganizationMember newMember = OrganizationMember.builder()
                    .user(existingUser)
                    .organization(org)
                    .role(defaultRole)
                    .roleName(defaultRole.getName())
                    .status(active ? "ACTIVE" : "SUSPENDED")
                    .isDefault(false)
                    .joinedAt(active ? LocalDateTime.now() : null)
                    .scimExternalId(externalId)
                    .scimManaged(true)
                    .build();
            OrganizationMember savedMember = memberRepository.save(newMember);

            if (active && keycloakAdminService != null) {
                keycloakAdminService.provisionScimUserInRealm(
                        KeycloakService.TENANT_SHARED_REALM,
                        email,
                        effectiveUsername,
                        nameParts.givenName(),
                        nameParts.familyName(),
                        defaultRole.getName(),
                        true
                );
            }

            emitScimAudit(org.getSlug(), "SCIM_USER_PROVISIONED", existingUser.getId().toString(),
                    Map.of("email", email, "action", "joined_existing_identity", "active", active), actor);
            return toScimUser(org.getSlug(), savedMember);
        }

        // Brand-new user: create in Keycloak FIRST so users.id == Keycloak UUID (prevents UUID_DRIFT)
        Role defaultRole = resolveDefaultTenantRole(org.getId());
        UUID targetUserId = UUID.randomUUID();
        if (keycloakAdminService != null) {
            try {
                String kcId = keycloakAdminService.provisionScimUserInRealm(
                        KeycloakService.TENANT_SHARED_REALM,
                        email,
                        effectiveUsername,
                        nameParts.givenName(),
                        nameParts.familyName(),
                        defaultRole.getName(),
                        active
                );
                if (kcId != null && !kcId.isBlank()) {
                    targetUserId = UUID.fromString(kcId);
                }
            } catch (Exception e) {
                log.warn("⚠️ Non-fatal Keycloak SCIM provisioning warning for '{}': {}", email, e.getMessage());
            }
        }

        String seed = email.split("@")[0];
        User newUser = User.builder()
                .id(targetUserId)
                .email(email)
                .username(effectiveUsername)
                .fullName(nameParts.fullName())
                .phone(phone)
                .jobTitle(title)
                .status(active ? "ACTIVE" : "SUSPENDED")
                .organization(org)
                .role(defaultRole)
                .avatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed)
                .build();
        User savedUser = userRepository.save(newUser);

        OrganizationMember newMember = OrganizationMember.builder()
                .user(savedUser)
                .organization(org)
                .role(defaultRole)
                .roleName(defaultRole.getName())
                .status(active ? "ACTIVE" : "SUSPENDED")
                .isDefault(true)
                .joinedAt(active ? LocalDateTime.now() : null)
                .scimExternalId(externalId)
                .scimManaged(true)
                .build();
        OrganizationMember savedMember = memberRepository.save(newMember);

        emitScimAudit(org.getSlug(), "SCIM_USER_PROVISIONED", savedUser.getId().toString(),
                Map.of("email", email, "action", "created", "active", active), actor);
        log.info("🚀 SCIM provisioned new user '{}' (ID: {}) in org '{}' (active={})",
                email, savedUser.getId(), org.getSlug(), active);
        return toScimUser(org.getSlug(), savedMember);
    }

    @Transactional
    public Map<String, Object> replaceUser(String orgSlug, String userIdRaw, Map<String, Object> payload, String actor) {
        Organization org = resolveOrg(orgSlug);
        UUID userId = parseUuid(userIdRaw, "Invalid SCIM User ID: " + userIdRaw);
        OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(userId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "User not found in organization."));

        if (payload == null) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidSyntax", "PUT payload cannot be empty.");
        }

        User user = member.getUser();
        NameParts nameParts = extractNameParts(payload, user.getEmail());
        String phone = extractPrimaryPhone(payload);
        String title = trimToNull(asString(payload.get("title")));
        String externalId = trimToNull(asString(payload.get("externalId")));
        String userName = trimToNull(asString(payload.get("userName")));
        Boolean active = payload.containsKey("active") ? toBooleanNullable(payload.get("active")) : null;

        applyProfileUpdatesToUser(user, nameParts.fullName(), phone, title, userName);
        if (externalId != null) {
            member.setScimExternalId(externalId);
        }
        member.setScimManaged(true);

        if (active != null) {
            applyMemberActivationState(org, member, user, active, actor);
        } else {
            userRepository.save(user);
            memberRepository.save(member);
            syncKeycloakAccountState(user, nameParts, member.getRoleName(), "ACTIVE".equalsIgnoreCase(member.getStatus()));
        }

        emitScimAudit(org.getSlug(), "SCIM_USER_UPDATED", user.getId().toString(),
                Map.of("email", user.getEmail(), "method", "PUT", "active", "ACTIVE".equalsIgnoreCase(member.getStatus())), actor);
        return toScimUser(org.getSlug(), member);
    }

    @Transactional
    public Map<String, Object> patchUser(String orgSlug, String userIdRaw, Map<String, Object> patchPayload, String actor) {
        Organization org = resolveOrg(orgSlug);
        UUID userId = parseUuid(userIdRaw, "Invalid SCIM User ID: " + userIdRaw);
        OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(userId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "User not found in organization."));

        User user = member.getUser();
        List<Map<String, Object>> operations = extractOperations(patchPayload);

        Boolean desiredActive = null;
        String updatedExternalId = null;
        String updatedTitle = null;
        String updatedFullName = null;
        String updatedPhone = null;

        for (Map<String, Object> opMap : operations) {
            String op = asString(opMap.get("op"));
            String normalizedOp = op != null ? op.trim().toLowerCase(Locale.ROOT) : "replace";
            if ("remove".equals(normalizedOp)) {
                continue;
            }
            String path = asString(opMap.get("path"));
            String normalizedPath = path != null ? path.trim().toLowerCase(Locale.ROOT) : "";
            Object valueObj = opMap.get("value");

            if (normalizedPath.isEmpty() && valueObj instanceof Map<?, ?> valMap) {
                // Okta pattern: { "op": "replace", "value": { "active": false, "displayName": "..." } }
                if (valMap.containsKey("active")) {
                    desiredActive = toBooleanNullable(valMap.get("active"));
                }
                if (valMap.containsKey("externalId")) {
                    updatedExternalId = trimToNull(asString(valMap.get("externalId")));
                }
                if (valMap.containsKey("title")) {
                    updatedTitle = trimToNull(asString(valMap.get("title")));
                }
                if (valMap.containsKey("displayName")) {
                    updatedFullName = trimToNull(asString(valMap.get("displayName")));
                }
                if (valMap.get("name") instanceof Map<?, ?> nameMap) {
                    NameParts np = extractNameFromMap(nameMap);
                    if (np != null) {
                        updatedFullName = np.fullName();
                    }
                }
            } else if ("active".equals(normalizedPath)) {
                // Entra ID pattern: { "op": "Replace", "path": "active", "value": false }
                desiredActive = toBooleanNullable(valueObj);
            } else if ("externalid".equals(normalizedPath)) {
                updatedExternalId = trimToNull(asString(valueObj));
            } else if ("title".equals(normalizedPath)) {
                updatedTitle = trimToNull(asString(valueObj));
            } else if ("displayname".equals(normalizedPath) || "name.formatted".equals(normalizedPath)) {
                updatedFullName = trimToNull(asString(valueObj));
            } else if (normalizedPath.startsWith("phonenumbers")) {
                updatedPhone = trimToNull(asString(valueObj));
            }
        }

        if (updatedExternalId != null) {
            member.setScimExternalId(updatedExternalId);
        }
        member.setScimManaged(true);
        applyProfileUpdatesToUser(user, updatedFullName, updatedPhone, updatedTitle, null);

        if (desiredActive != null) {
            applyMemberActivationState(org, member, user, desiredActive, actor);
        } else {
            userRepository.save(user);
            memberRepository.save(member);
        }

        emitScimAudit(org.getSlug(),
                desiredActive != null && !desiredActive ? "SCIM_USER_DEPROVISIONED" : "SCIM_USER_UPDATED",
                user.getId().toString(),
                Map.of("email", user.getEmail(), "method", "PATCH", "active", "ACTIVE".equalsIgnoreCase(member.getStatus())),
                actor);
        return toScimUser(org.getSlug(), member);
    }

    @Transactional
    public void deleteUser(String orgSlug, String userIdRaw, String actor) {
        Organization org = resolveOrg(orgSlug);
        UUID userId = parseUuid(userIdRaw, "Invalid SCIM User ID: " + userIdRaw);
        OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(userId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "User not found in organization."));

        // Soft-Deprovision (User approved Decision #4): preserves audit FK & history while enforcing instant lockout
        applyMemberActivationState(org, member, member.getUser(), false, actor);
        emitScimAudit(org.getSlug(), "SCIM_USER_DEPROVISIONED", userId.toString(),
                Map.of("email", member.getUser().getEmail(), "method", "DELETE", "mode", "SOFT_DEPROVISION"), actor);
    }

    // -------------------------------------------------------------------------
    // /Groups Operations & Group-to-Role Mapping
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Map<String, Object> listGroups(String orgSlug, String filter, int startIndex, int count) {
        Organization org = resolveOrg(orgSlug);
        List<OrganizationScimGroup> groups = groupRepository.findByOrganizationIdOrderByDisplayNameAsc(org.getId());

        if (filter != null && !filter.isBlank()) {
            Matcher m = FILTER_EQ_PATTERN.matcher(filter);
            if (!m.matches()) {
                throw new ScimException(HttpStatus.BAD_REQUEST, "invalidFilter",
                        "Unsupported Group filter. Supported: displayName eq \"...\", externalId eq \"...\".");
            }
            String attr = m.group(1).toLowerCase(Locale.ROOT);
            String target = m.group(2).trim();
            groups = groups.stream().filter(g -> switch (attr) {
                case "displayname" -> g.getDisplayName().equalsIgnoreCase(target);
                case "externalid" -> g.getExternalId() != null && g.getExternalId().equalsIgnoreCase(target);
                default -> throw new ScimException(HttpStatus.BAD_REQUEST, "invalidFilter",
                        "Unsupported Group filter attribute: " + attr);
            }).toList();
        }

        List<Map<String, Object>> resources = groups.stream()
                .map(g -> toScimGroup(org.getSlug(), g))
                .toList();
        return paginateResources(resources, startIndex, count);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroup(String orgSlug, String groupIdRaw) {
        Organization org = resolveOrg(orgSlug);
        UUID groupId = parseUuid(groupIdRaw, "Invalid SCIM Group ID: " + groupIdRaw);
        OrganizationScimGroup group = groupRepository.findByIdAndOrganizationId(groupId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "Group not found in organization."));
        return toScimGroup(org.getSlug(), group);
    }

    @Transactional
    public Map<String, Object> createGroup(String orgSlug, Map<String, Object> payload, String actor) {
        Organization org = resolveOrg(orgSlug);
        if (payload == null) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidSyntax", "Group payload cannot be empty.");
        }
        String displayName = trimToNull(asString(payload.get("displayName")));
        if (displayName == null) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidValue", "Group displayName is required.");
        }
        if (groupRepository.findByOrganizationIdAndDisplayNameIgnoreCase(org.getId(), displayName).isPresent()) {
            throw new ScimException(HttpStatus.CONFLICT, "uniqueness",
                    "Group '" + displayName + "' already exists in organization '" + org.getSlug() + "'.");
        }
        String externalId = trimToNull(asString(payload.get("externalId")));
        Role autoRole = tryAutoMapTenantRole(org.getId(), displayName);

        OrganizationScimGroup group = OrganizationScimGroup.builder()
                .organization(org)
                .displayName(displayName)
                .externalId(externalId)
                .mappedRole(autoRole)
                .mappedRoleName(autoRole != null ? autoRole.getName() : null)
                .build();
        OrganizationScimGroup savedGroup = groupRepository.save(group);

        Set<UUID> memberUserIds = extractGroupMemberIds(payload.get("members"));
        syncGroupMembershipFull(org, savedGroup, memberUserIds);

        emitScimAudit(org.getSlug(), "SCIM_GROUP_CREATED", savedGroup.getId().toString(),
                Map.of("displayName", displayName, "memberCount", memberUserIds.size()), actor);
        return toScimGroup(org.getSlug(), savedGroup);
    }

    @Transactional
    public Map<String, Object> replaceGroup(String orgSlug, String groupIdRaw, Map<String, Object> payload, String actor) {
        Organization org = resolveOrg(orgSlug);
        UUID groupId = parseUuid(groupIdRaw, "Invalid SCIM Group ID: " + groupIdRaw);
        OrganizationScimGroup group = groupRepository.findByIdAndOrganizationId(groupId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "Group not found in organization."));

        String displayName = trimToNull(asString(payload != null ? payload.get("displayName") : null));
        if (displayName != null) {
            group.setDisplayName(displayName);
        }
        String externalId = trimToNull(asString(payload != null ? payload.get("externalId") : null));
        if (externalId != null) {
            group.setExternalId(externalId);
        }
        groupRepository.save(group);

        if (payload != null && payload.containsKey("members")) {
            Set<UUID> memberIds = extractGroupMemberIds(payload.get("members"));
            syncGroupMembershipFull(org, group, memberIds);
        }

        emitScimAudit(org.getSlug(), "SCIM_GROUP_UPDATED", group.getId().toString(),
                Map.of("displayName", group.getDisplayName(), "method", "PUT"), actor);
        return toScimGroup(org.getSlug(), group);
    }

    @Transactional
    public Map<String, Object> patchGroup(String orgSlug, String groupIdRaw, Map<String, Object> patchPayload, String actor) {
        Organization org = resolveOrg(orgSlug);
        UUID groupId = parseUuid(groupIdRaw, "Invalid SCIM Group ID: " + groupIdRaw);
        OrganizationScimGroup group = groupRepository.findByIdAndOrganizationId(groupId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "Group not found in organization."));

        List<Map<String, Object>> operations = extractOperations(patchPayload);
        Set<UUID> affectedUserIds = new LinkedHashSet<>();

        for (Map<String, Object> opMap : operations) {
            String op = asString(opMap.get("op"));
            String normalizedOp = op != null ? op.trim().toLowerCase(Locale.ROOT) : "replace";
            String path = trimToNull(asString(opMap.get("path")));
            Object valueObj = opMap.get("value");

            if (path == null && valueObj instanceof Map<?, ?> valMap) {
                Object dn = valMap.get("displayName");
                if (dn != null && !asString(dn).isBlank()) {
                    group.setDisplayName(asString(dn).trim());
                }
                if (valMap.containsKey("members")) {
                    Set<UUID> ids = extractGroupMemberIds(valMap.get("members"));
                    if ("remove".equals(normalizedOp)) {
                        removeMembersFromGroup(group, ids, affectedUserIds);
                    } else if ("replace".equals(normalizedOp)) {
                        syncGroupMembershipFull(org, group, ids);
                    } else {
                        addMembersToGroup(org, group, ids, affectedUserIds);
                    }
                }
                continue;
            }

            if (path != null && "displayName".equalsIgnoreCase(path)) {
                String dn = trimToNull(asString(valueObj));
                if (dn != null) {
                    group.setDisplayName(dn);
                }
                continue;
            }

            if (path != null && path.toLowerCase(Locale.ROOT).startsWith("members")) {
                Matcher filterMatcher = MEMBER_PATH_FILTER_PATTERN.matcher(path);
                if (filterMatcher.matches() && "remove".equals(normalizedOp)) {
                    UUID targetUid = parseUuid(filterMatcher.group(1), "Invalid member value UUID in filter");
                    removeMembersFromGroup(group, Set.of(targetUid), affectedUserIds);
                    continue;
                }

                Set<UUID> ids = extractGroupMemberIds(valueObj);
                if ("remove".equals(normalizedOp)) {
                    removeMembersFromGroup(group, ids, affectedUserIds);
                } else if ("replace".equals(normalizedOp)) {
                    syncGroupMembershipFull(org, group, ids);
                } else {
                    addMembersToGroup(org, group, ids, affectedUserIds);
                }
            }
        }

        groupRepository.save(group);
        for (UUID uid : affectedUserIds) {
            userRepository.findById(uid).ifPresent(u -> reconcileEffectiveRoleFromScimGroups(org, u));
        }

        emitScimAudit(org.getSlug(), "SCIM_GROUP_UPDATED", group.getId().toString(),
                Map.of("displayName", group.getDisplayName(), "method", "PATCH"), actor);
        return toScimGroup(org.getSlug(), group);
    }

    @Transactional
    public void deleteGroup(String orgSlug, String groupIdRaw, String actor) {
        Organization org = resolveOrg(orgSlug);
        UUID groupId = parseUuid(groupIdRaw, "Invalid SCIM Group ID: " + groupIdRaw);
        OrganizationScimGroup group = groupRepository.findByIdAndOrganizationId(groupId, org.getId())
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "Group not found in organization."));

        List<OrganizationScimGroupMember> existingMembers = groupMemberRepository.findByGroupId(group.getId());
        List<UUID> affectedUsers = existingMembers.stream()
                .map(gm -> gm.getUser().getId())
                .toList();

        groupMemberRepository.deleteByGroupId(group.getId());
        groupRepository.delete(group);
        groupRepository.flush();

        for (UUID uid : affectedUsers) {
            userRepository.findById(uid).ifPresent(u -> reconcileEffectiveRoleFromScimGroups(org, u));
        }

        emitScimAudit(org.getSlug(), "SCIM_GROUP_DELETED", groupId.toString(),
                Map.of("displayName", group.getDisplayName()), actor);
    }

    // -------------------------------------------------------------------------
    // Core Offboarding, Multi-Workspace Isolation & Role Reconciliation Logic
    // -------------------------------------------------------------------------

    private void applyMemberActivationState(
            Organization org,
            OrganizationMember member,
            User user,
            boolean active,
            String actor
    ) {
        if (!active) {
            // Enforce Last Admin Guard before disabling an admin member
            if ("admin".equalsIgnoreCase(member.getRoleName()) || "owner".equalsIgnoreCase(member.getRoleName())) {
                long activeAdminCount = memberRepository.findByOrganizationIdAndStatus(org.getId(), "ACTIVE").stream()
                        .filter(m -> "admin".equalsIgnoreCase(m.getRoleName()) || "owner".equalsIgnoreCase(m.getRoleName()))
                        .count();
                if (activeAdminCount <= 1 && "ACTIVE".equalsIgnoreCase(member.getStatus())) {
                    throw new ScimException(HttpStatus.BAD_REQUEST, "mutability",
                            "Cannot deprovision the last active administrator of organization '" + org.getSlug() + "'.");
                }
            }

            member.setStatus("SUSPENDED");
            member.setScimManaged(true);
            memberRepository.save(member);

            // Multi-Workspace Safety: only suspend global user & disable Keycloak if 0 active orgs remain
            List<OrganizationMember> remainingActive = memberRepository.findActiveWorkspacesByUserId(user.getId()).stream()
                    .filter(m -> !m.getOrganization().getId().equals(org.getId()))
                    .toList();

            boolean noActiveWorkspacesLeft = remainingActive.isEmpty();
            if (noActiveWorkspacesLeft) {
                user.setStatus("SUSPENDED");
            } else if (user.getOrganization() != null && user.getOrganization().getId().equals(org.getId())) {
                OrganizationMember fallbackOrgMember = remainingActive.get(0);
                user.setOrganization(fallbackOrgMember.getOrganization());
                if (fallbackOrgMember.getRole() != null) {
                    user.setRole(fallbackOrgMember.getRole());
                }
            }
            userRepository.save(user);

            // Zero-Window Session & Credential Revocation
            purgeUserAuthCacheAndSessions(user);
            if (keycloakAdminService != null && user.getEmail() != null) {
                keycloakAdminService.logoutAllUserSessionsInRealm(KeycloakService.TENANT_SHARED_REALM, user.getEmail());
                if (noActiveWorkspacesLeft) {
                    keycloakAdminService.setUserEnabledInRealm(KeycloakService.TENANT_SHARED_REALM, user.getEmail(), false);
                }
            }
            log.info("🔒 SCIM Zero-Window Offboarding completed for user '{}' in org '{}' (globalSuspended={}, actor={})",
                    user.getEmail(), org.getSlug(), noActiveWorkspacesLeft, actor);
        } else {
            member.setStatus("ACTIVE");
            member.setScimManaged(true);
            if (member.getJoinedAt() == null) {
                member.setJoinedAt(LocalDateTime.now());
            }
            memberRepository.save(member);

            user.setStatus("ACTIVE");
            if (user.getOrganization() == null) {
                user.setOrganization(org);
            }
            userRepository.save(user);

            if (keycloakAdminService != null && user.getEmail() != null) {
                keycloakAdminService.setUserEnabledInRealm(KeycloakService.TENANT_SHARED_REALM, user.getEmail(), true);
            }
            log.info("✅ SCIM Reactivated user '{}' in org '{}' (actor={})", user.getEmail(), org.getSlug(), actor);
        }
    }

    private void purgeUserAuthCacheAndSessions(User user) {
        if (redisTemplate == null || user == null || user.getId() == null) {
            return;
        }
        String uid = user.getId().toString();
        try {
            deleteRedisKeysByPrefix("auth:sudo:" + uid + "*");
            deleteRedisKeysByPrefix("auth:login-fresh:" + uid + "*");
            deleteRedisKeysByPrefix("auth:break-glass-exp:" + uid);
        } catch (Exception e) {
            log.debug("Non-fatal Redis session cleanup warning for user {}: {}", uid, e.getMessage());
        }
    }

    private void deleteRedisKeysByPrefix(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private void syncGroupMembershipFull(Organization org, OrganizationScimGroup group, Set<UUID> desiredUserIds) {
        List<OrganizationScimGroupMember> current = groupMemberRepository.findByGroupId(group.getId());
        Set<UUID> affected = new LinkedHashSet<>();
        for (OrganizationScimGroupMember gm : current) {
            affected.add(gm.getUser().getId());
        }
        groupMemberRepository.deleteByGroupId(group.getId());
        groupMemberRepository.flush();

        addMembersToGroup(org, group, desiredUserIds, affected);
        for (UUID uid : affected) {
            userRepository.findById(uid).ifPresent(u -> reconcileEffectiveRoleFromScimGroups(org, u));
        }
    }

    private void addMembersToGroup(
            Organization org,
            OrganizationScimGroup group,
            Set<UUID> userIds,
            Set<UUID> affected
    ) {
        for (UUID uid : userIds) {
            Optional<OrganizationMember> orgMemberOpt = memberRepository.findByUserIdAndOrganizationId(uid, org.getId());
            if (orgMemberOpt.isEmpty()) {
                throw new ScimException(HttpStatus.BAD_REQUEST, "invalidValue",
                        "User ID '" + uid + "' is not a member of organization '" + org.getSlug() + "'.");
            }
            if (groupMemberRepository.findByGroupIdAndUserId(group.getId(), uid).isEmpty()) {
                OrganizationScimGroupMember gm = OrganizationScimGroupMember.builder()
                        .group(group)
                        .user(orgMemberOpt.get().getUser())
                        .build();
                groupMemberRepository.save(gm);
            }
            affected.add(uid);
        }
    }

    private void removeMembersFromGroup(OrganizationScimGroup group, Set<UUID> userIds, Set<UUID> affected) {
        for (UUID uid : userIds) {
            groupMemberRepository.deleteByGroupIdAndUserId(group.getId(), uid);
            affected.add(uid);
        }
    }

    private void reconcileEffectiveRoleFromScimGroups(Organization org, User user) {
        List<OrganizationScimGroup> mappedGroups = groupMemberRepository.findActiveMappedGroupsForUserInOrg(user.getId(), org.getId());
        Role bestRole = mappedGroups.stream()
                .map(OrganizationScimGroup::getMappedRole)
                .filter(Objects::nonNull)
                .filter(r -> "TENANT".equalsIgnoreCase(r.getScope())) // Scope Air-Gap enforcement
                .max(Comparator.comparingInt(r -> ROLE_RANK.getOrDefault(r.getName().toLowerCase(Locale.ROOT), 40)))
                .orElse(null);

        if (bestRole == null) {
            return; // Preserve current role if no SCIM group is explicitly mapped to a K2NET Role
        }

        Optional<OrganizationMember> memberOpt = memberRepository.findByUserIdAndOrganizationId(user.getId(), org.getId());
        if (memberOpt.isEmpty()) {
            return;
        }
        OrganizationMember member = memberOpt.get();

        // Last Admin Guard: never downgrade the sole admin via SCIM group change
        if ("admin".equalsIgnoreCase(member.getRoleName()) && !"admin".equalsIgnoreCase(bestRole.getName())) {
            long activeAdminCount = memberRepository.findByOrganizationIdAndStatus(org.getId(), "ACTIVE").stream()
                    .filter(m -> "admin".equalsIgnoreCase(m.getRoleName()) || "owner".equalsIgnoreCase(m.getRoleName()))
                    .count();
            if (activeAdminCount <= 1) {
                log.warn("🛡️ SCIM Group Role Reconciliation skipped downgrading sole admin '{}' in org '{}'",
                        user.getEmail(), org.getSlug());
                return;
            }
        }

        member.setRole(bestRole);
        member.setRoleName(bestRole.getName());
        memberRepository.save(member);

        if (user.getOrganization() != null && user.getOrganization().getId().equals(org.getId())) {
            user.setRole(bestRole);
            userRepository.save(user);
        }
        if (keycloakAdminService != null && user.getEmail() != null) {
            try {
                keycloakAdminService.updateUserRoleInRealm(KeycloakService.TENANT_SHARED_REALM, user.getEmail(), bestRole.getName());
            } catch (Exception e) {
                log.debug("Keycloak SCIM group role sync warning for {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    private Role resolveDefaultTenantRole(UUID orgId) {
        return roleRepository.findByNameAndOrganizationId("viewer", orgId)
                .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                .or(() -> roleRepository.findByNameAndScopeAndOrganizationIsNull("viewer", "TENANT"))
                .orElseThrow(() -> new IllegalStateException("Default TENANT 'viewer' role missing."));
    }

    private Role tryAutoMapTenantRole(UUID orgId, String groupDisplayName) {
        if (groupDisplayName == null || groupDisplayName.isBlank()) {
            return null;
        }
        String candidate = groupDisplayName.trim().toLowerCase(Locale.ROOT);
        if (candidate.startsWith("k2net-")) {
            candidate = candidate.substring("k2net-".length());
        } else if (candidate.startsWith("k2net_")) {
            candidate = candidate.substring("k2net_".length());
        }
        final String normalized = candidate;
        return roleRepository.findByNameAndOrganizationId(normalized, orgId)
                .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                .or(() -> roleRepository.findByNameAndScopeAndOrganizationIsNull(normalized, "TENANT"))
                .orElse(null);
    }

    private void syncKeycloakAccountState(User user, NameParts nameParts, String roleName, boolean active) {
        if (keycloakAdminService == null || user == null || user.getEmail() == null) {
            return;
        }
        try {
            keycloakAdminService.provisionScimUserInRealm(
                    KeycloakService.TENANT_SHARED_REALM,
                    user.getEmail(),
                    user.getUsername(),
                    nameParts.givenName(),
                    nameParts.familyName(),
                    roleName,
                    active
            );
        } catch (Exception e) {
            log.debug("Non-fatal Keycloak SCIM profile sync warning for {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private String resolveGlobalStatusAfterOrgChange(User user, UUID excludingOrgId, boolean active) {
        if (active) {
            return "ACTIVE";
        }
        boolean hasOtherActive = memberRepository.findActiveWorkspacesByUserId(user.getId()).stream()
                .anyMatch(m -> !m.getOrganization().getId().equals(excludingOrgId));
        return hasOtherActive ? "ACTIVE" : "SUSPENDED";
    }

    private void applyProfileUpdatesToUser(User user, String fullName, String phone, String title, String userName) {
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null && !phone.isBlank()) {
            user.setPhone(phone.trim());
        }
        if (title != null && !title.isBlank()) {
            user.setJobTitle(title.trim());
        }
        if (userName != null && !userName.isBlank()) {
            user.setUsername(userName.trim());
        }
    }

    // -------------------------------------------------------------------------
    // SCIM 2.0 JSON Mappers & Parsers
    // -------------------------------------------------------------------------

    private Map<String, Object> toScimUser(String orgSlug, OrganizationMember member) {
        User u = member.getUser();
        boolean isActive = "ACTIVE".equalsIgnoreCase(member.getStatus()) && "ACTIVE".equalsIgnoreCase(u.getStatus());
        String fullName = u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail();
        String[] parts = fullName.trim().split("\\s+", 2);
        String givenName = parts[0];
        String familyName = parts.length > 1 ? parts[1] : "";

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("schemas", List.of(SCIM_USER_SCHEMA));
        res.put("id", u.getId().toString());
        if (member.getScimExternalId() != null) {
            res.put("externalId", member.getScimExternalId());
        }
        res.put("userName", u.getUsername() != null && !u.getUsername().isBlank() ? u.getUsername() : u.getEmail());
        res.put("displayName", fullName);
        res.put("name", Map.of(
                "formatted", fullName,
                "givenName", givenName,
                "familyName", familyName
        ));
        if (u.getJobTitle() != null) {
            res.put("title", u.getJobTitle());
        }
        res.put("emails", List.of(Map.of(
                "value", u.getEmail(),
                "type", "work",
                "primary", true
        )));
        if (u.getPhone() != null) {
            res.put("phoneNumbers", List.of(Map.of(
                    "value", u.getPhone(),
                    "type", "work",
                    "primary", true
            )));
        }
        res.put("active", isActive);
        res.put("roles", List.of(Map.of(
                "value", member.getRoleName() != null ? member.getRoleName() : "viewer",
                "display", member.getRole() != null && member.getRole().getDisplayName() != null
                        ? member.getRole().getDisplayName()
                        : (member.getRoleName() != null ? member.getRoleName() : "viewer"),
                "primary", true
        )));
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("resourceType", "User");
        if (u.getCreatedAt() != null) {
            meta.put("created", u.getCreatedAt().atOffset(ZoneOffset.UTC).toString());
        }
        if (member.getUpdatedAt() != null) {
            meta.put("lastModified", member.getUpdatedAt().atOffset(ZoneOffset.UTC).toString());
        }
        meta.put("location", "/api/v1/scim/v2/" + orgSlug + "/Users/" + u.getId());
        res.put("meta", meta);
        return res;
    }

    private Map<String, Object> toScimGroup(String orgSlug, OrganizationScimGroup group) {
        List<OrganizationScimGroupMember> members = groupMemberRepository.findByGroupIdWithUser(group.getId());
        List<Map<String, Object>> scimMembers = members.stream().map(gm -> {
            User u = gm.getUser();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("value", u.getId().toString());
            entry.put("display", u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail());
            entry.put("$ref", "/api/v1/scim/v2/" + orgSlug + "/Users/" + u.getId());
            return entry;
        }).toList();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("schemas", List.of(SCIM_GROUP_SCHEMA));
        res.put("id", group.getId().toString());
        if (group.getExternalId() != null) {
            res.put("externalId", group.getExternalId());
        }
        res.put("displayName", group.getDisplayName());
        res.put("members", scimMembers);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("resourceType", "Group");
        if (group.getCreatedAt() != null) {
            meta.put("created", group.getCreatedAt().atOffset(ZoneOffset.UTC).toString());
        }
        if (group.getUpdatedAt() != null) {
            meta.put("lastModified", group.getUpdatedAt().atOffset(ZoneOffset.UTC).toString());
        }
        meta.put("location", "/api/v1/scim/v2/" + orgSlug + "/Groups/" + group.getId());
        res.put("meta", meta);
        return res;
    }

    private Map<String, Object> paginateResources(List<Map<String, Object>> all, int startIndex, int count) {
        int safeStart = Math.max(1, startIndex);
        int safeCount = Math.max(0, Math.min(count, 200));
        int fromIdx = Math.min(safeStart - 1, all.size());
        int toIdx = Math.min(fromIdx + safeCount, all.size());
        List<Map<String, Object>> page = all.subList(fromIdx, toIdx);
        return buildListResponse(page, all.size(), safeStart);
    }

    private Map<String, Object> buildListResponse(List<Map<String, Object>> resources, int totalResults, int startIndex) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("schemas", List.of(SCIM_LIST_RESPONSE_SCHEMA));
        res.put("totalResults", totalResults);
        res.put("itemsPerPage", resources.size());
        res.put("startIndex", startIndex);
        res.put("Resources", resources);
        return res;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractOperations(Map<String, Object> patchPayload) {
        if (patchPayload == null) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidSyntax", "PATCH payload cannot be empty.");
        }
        Object ops = patchPayload.get("Operations");
        if (ops == null) {
            ops = patchPayload.get("operations");
        }
        if (!(ops instanceof List<?> list)) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidSyntax", "PATCH payload must contain Operations array.");
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                result.add((Map<String, Object>) m);
            }
        }
        return result;
    }

    private Set<UUID> extractGroupMemberIds(Object membersObj) {
        Set<UUID> ids = new LinkedHashSet<>();
        if (!(membersObj instanceof List<?> list)) {
            return ids;
        }
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                String val = trimToNull(asString(m.get("value")));
                if (val != null) {
                    ids.add(parseUuid(val, "Invalid Group member UUID: " + val));
                }
            }
        }
        return ids;
    }

    private String extractPrimaryEmail(Map<String, Object> payload) {
        Object emailsObj = payload.get("emails");
        if (emailsObj instanceof List<?> list) {
            String first = null;
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    String val = trimToNull(asString(m.get("value")));
                    if (val != null) {
                        if (Boolean.TRUE.equals(toBooleanNullable(m.get("primary")))) {
                            return val;
                        }
                        if (first == null) {
                            first = val;
                        }
                    }
                }
            }
            if (first != null) {
                return first;
            }
        }
        return trimToNull(asString(payload.get("email")));
    }

    private String extractPrimaryPhone(Map<String, Object> payload) {
        Object phonesObj = payload.get("phoneNumbers");
        if (phonesObj instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    String val = trimToNull(asString(m.get("value")));
                    if (val != null) {
                        return val;
                    }
                }
            }
        }
        return null;
    }

    private NameParts extractNameParts(Map<String, Object> payload, String fallbackEmail) {
        Object nameObj = payload.get("name");
        if (nameObj instanceof Map<?, ?> nameMap) {
            NameParts np = extractNameFromMap(nameMap);
            if (np != null) {
                return np;
            }
        }
        String displayName = trimToNull(asString(payload.get("displayName")));
        if (displayName != null) {
            String[] parts = displayName.split("\\s+", 2);
            return new NameParts(parts[0], parts.length > 1 ? parts[1] : "", displayName);
        }
        String local = fallbackEmail != null && fallbackEmail.contains("@") ? fallbackEmail.split("@")[0] : "User";
        return new NameParts(local, "", local);
    }

    private NameParts extractNameFromMap(Map<?, ?> nameMap) {
        String given = trimToNull(asString(nameMap.get("givenName")));
        String family = trimToNull(asString(nameMap.get("familyName")));
        String formatted = trimToNull(asString(nameMap.get("formatted")));
        String full = formatted;
        if (full == null) {
            full = ((given != null ? given : "") + " " + (family != null ? family : "")).trim();
        }
        if (full.isBlank()) {
            return null;
        }
        if (given == null) {
            String[] parts = full.split("\\s+", 2);
            given = parts[0];
            if (family == null) {
                family = parts.length > 1 ? parts[1] : "";
            }
        }
        return new NameParts(given, family != null ? family : "", full);
    }

    private boolean extractActiveFlag(Map<String, Object> payload, boolean defaultVal) {
        if (!payload.containsKey("active") || payload.get("active") == null) {
            return defaultVal;
        }
        Boolean b = toBooleanNullable(payload.get("active"));
        return b != null ? b : defaultVal;
    }

    private Boolean toBooleanNullable(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof Boolean b) {
            return b;
        }
        String s = val.toString().trim().toLowerCase(Locale.ROOT);
        if ("true".equals(s)) {
            return Boolean.TRUE;
        }
        if ("false".equals(s)) {
            return Boolean.FALSE;
        }
        return null;
    }

    private Organization resolveOrg(String orgSlug) {
        return organizationRepository.findBySlug(orgSlug.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ScimException(HttpStatus.NOT_FOUND, "Organization not found: " + orgSlug));
    }

    private UUID parseUuid(String raw, String message) {
        try {
            return UUID.fromString(raw.trim());
        } catch (Exception e) {
            throw new ScimException(HttpStatus.BAD_REQUEST, "invalidValue", message);
        }
    }

    private String asString(Object o) {
        return o != null ? o.toString() : null;
    }

    private String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private void emitScimAudit(String tenantSlug, String action, String resourceId, Map<String, Object> details, String actor) {
        try {
            auditLoggingService.logEvent(
                    tenantSlug,
                    action,
                    "SCIM_PROVISIONING",
                    resourceId,
                    null,
                    details,
                    Map.of("actor", actor != null ? actor : "scim:system", "protocol", "SCIM_2_0")
            );
        } catch (Exception e) {
            log.debug("Non-fatal: failed writing SCIM protocol audit {}: {}", action, e.getMessage());
        }
    }

    private record NameParts(String givenName, String familyName, String fullName) {
    }
}
