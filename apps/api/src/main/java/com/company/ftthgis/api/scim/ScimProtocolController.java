package com.company.ftthgis.api.scim;

import com.company.ftthgis.config.security.ScimPrincipal;
import com.company.ftthgis.service.scim.ScimProvisioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * RFC 7643 & RFC 7644 Enterprise SCIM 2.0 Server Endpoint Controller.
 * Compatible with Okta Lifecycle Management and Microsoft Entra ID Provisioning.
 */
@RestController
@RequestMapping("/api/v1/scim/v2/{orgSlug}")
@PreAuthorize("hasAuthority('scim.provision') and @scimSecurity.matchesTenant(#orgSlug)")
@RequiredArgsConstructor
public class ScimProtocolController {

    private static final String SCIM_MEDIA_TYPE = "application/scim+json;charset=UTF-8";

    private final ScimProvisioningService scimProvisioningService;

    @GetMapping("/ServiceProviderConfig")
    public ResponseEntity<Map<String, Object>> getServiceProviderConfig(@PathVariable String orgSlug) {
        return scimOk(scimProvisioningService.getServiceProviderConfig(orgSlug));
    }

    @GetMapping("/ResourceTypes")
    public ResponseEntity<Map<String, Object>> getResourceTypes(@PathVariable String orgSlug) {
        return scimOk(scimProvisioningService.getResourceTypes(orgSlug));
    }

    @GetMapping("/Schemas")
    public ResponseEntity<Map<String, Object>> getSchemas(@PathVariable String orgSlug) {
        return scimOk(scimProvisioningService.getSchemas());
    }

    @GetMapping("/Users")
    public ResponseEntity<Map<String, Object>> listUsers(
            @PathVariable String orgSlug,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "1") int startIndex,
            @RequestParam(defaultValue = "100") int count
    ) {
        return scimOk(scimProvisioningService.listUsers(orgSlug, filter, startIndex, count));
    }

    @GetMapping("/Users/{userId}")
    public ResponseEntity<Map<String, Object>> getUser(
            @PathVariable String orgSlug,
            @PathVariable String userId
    ) {
        return scimOk(scimProvisioningService.getUser(orgSlug, userId));
    }

    @PostMapping("/Users")
    public ResponseEntity<Map<String, Object>> createUser(
            @PathVariable String orgSlug,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        Map<String, Object> created = scimProvisioningService.createUser(orgSlug, payload, resolveActor(authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.CONTENT_TYPE, SCIM_MEDIA_TYPE)
                .body(created);
    }

    @PutMapping("/Users/{userId}")
    public ResponseEntity<Map<String, Object>> replaceUser(
            @PathVariable String orgSlug,
            @PathVariable String userId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        return scimOk(scimProvisioningService.replaceUser(orgSlug, userId, payload, resolveActor(authentication)));
    }

    @PatchMapping("/Users/{userId}")
    public ResponseEntity<Map<String, Object>> patchUser(
            @PathVariable String orgSlug,
            @PathVariable String userId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        return scimOk(scimProvisioningService.patchUser(orgSlug, userId, payload, resolveActor(authentication)));
    }

    @DeleteMapping("/Users/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String orgSlug,
            @PathVariable String userId,
            Authentication authentication
    ) {
        scimProvisioningService.deleteUser(orgSlug, userId, resolveActor(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/Groups")
    public ResponseEntity<Map<String, Object>> listGroups(
            @PathVariable String orgSlug,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "1") int startIndex,
            @RequestParam(defaultValue = "100") int count
    ) {
        return scimOk(scimProvisioningService.listGroups(orgSlug, filter, startIndex, count));
    }

    @GetMapping("/Groups/{groupId}")
    public ResponseEntity<Map<String, Object>> getGroup(
            @PathVariable String orgSlug,
            @PathVariable String groupId
    ) {
        return scimOk(scimProvisioningService.getGroup(orgSlug, groupId));
    }

    @PostMapping("/Groups")
    public ResponseEntity<Map<String, Object>> createGroup(
            @PathVariable String orgSlug,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        Map<String, Object> created = scimProvisioningService.createGroup(orgSlug, payload, resolveActor(authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.CONTENT_TYPE, SCIM_MEDIA_TYPE)
                .body(created);
    }

    @PutMapping("/Groups/{groupId}")
    public ResponseEntity<Map<String, Object>> replaceGroup(
            @PathVariable String orgSlug,
            @PathVariable String groupId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        return scimOk(scimProvisioningService.replaceGroup(orgSlug, groupId, payload, resolveActor(authentication)));
    }

    @PatchMapping("/Groups/{groupId}")
    public ResponseEntity<Map<String, Object>> patchGroup(
            @PathVariable String orgSlug,
            @PathVariable String groupId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        return scimOk(scimProvisioningService.patchGroup(orgSlug, groupId, payload, resolveActor(authentication)));
    }

    @DeleteMapping("/Groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable String orgSlug,
            @PathVariable String groupId,
            Authentication authentication
    ) {
        scimProvisioningService.deleteGroup(orgSlug, groupId, resolveActor(authentication));
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<Map<String, Object>> scimOk(Map<String, Object> body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, SCIM_MEDIA_TYPE)
                .body(body);
    }

    private String resolveActor(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof ScimPrincipal principal) {
            return "scim:" + principal.tokenName() + " (" + principal.tokenId() + ")";
        }
        return "scim:system";
    }
}
