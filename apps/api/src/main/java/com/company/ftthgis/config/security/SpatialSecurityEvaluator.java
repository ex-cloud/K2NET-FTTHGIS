package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.task.repository.TaskRepository;
import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Lapis 3: ABAC Spatial & Row-Level Authorization Evaluator (Pola A Mandiri).
 *
 * <p>Mengevaluasi izin mutasi resource spasial dan jaringan secara terpadu (Base Role OR Project Role)
 * tanpa bergantung pada header client {@code X-Project-ID}.
 */
@Component("spatialSecurityEvaluator")
@RequiredArgsConstructor
@Slf4j
public class SpatialSecurityEvaluator {

    private final ProjectMemberRepository projectMemberRepository;
    private final NetworkNodeRepository networkNodeRepository;
    private final FiberCableRepository fiberCableRepository;
    private final TaskRepository taskRepository;
    private final TenantSecurity tenantSecurity;

    /**
     * Evaluasi otorisasi tingkat proyek secara mandiri (Pola A).
     *
     * @param projectId ID proyek target
     * @param permissionCode Kode permission (misal: 'network.manage', 'projects.edit')
     * @return true jika diizinkan, false jika ditolak
     */
    public boolean hasProjectPermission(UUID projectId, String permissionCode) {
        if (projectId == null || permissionCode == null || permissionCode.isBlank()) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }

        // Lapis 1: VIP Bypass / All-Projects Tier (super_admin, tenant admin/supervisor)
        if (isAllProjectsTier(auth, projectId)) {
            return true;
        }

        // Lapis 2: Base Role Evaluation (staf internal dengan permission global)
        boolean hasBaseAuthority = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase(permissionCode));
        if (hasBaseAuthority) {
            // Verifikasi bahwa user minimal memiliki akses ke organisasi pemilik project
            return tenantSecurity.canAccessProject(projectId);
        }

        // Lapis 3: Project-Scoped Role (kasus vendor/kontraktor luar — TENT-10)
        UUID userId = extractUserId(auth);
        if (userId != null) {
            Optional<ProjectMember> pmOpt = projectMemberRepository.findByUserIdAndProjectId(userId, projectId);
            if (pmOpt.isPresent()) {
                ProjectMember pm = pmOpt.get();
                if (pm.getRole() != null && pm.getRole().getPermissions() != null) {
                    return pm.getRole().getPermissions().stream()
                            .anyMatch(p -> p.getCode().equalsIgnoreCase(permissionCode));
                }
            }
        }

        return false;
    }

    /**
     * Evaluasi otorisasi mutasi node jaringan (OLT, ODC, ODP, Customer).
     */
    public boolean canAccessNode(UUID nodeId, String permissionCode) {
        if (nodeId == null || permissionCode == null || permissionCode.isBlank()) {
            return false;
        }

        Optional<NetworkNode> nodeOpt = networkNodeRepository.findById(nodeId);
        if (nodeOpt.isEmpty()) {
            return false;
        }

        NetworkNode node = nodeOpt.get();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Cek JIT Task Assignment: Teknisi darurat yang ditugaskan menangani tiket aset ini
        if (auth != null && node.getCode() != null) {
            String sub = auth.getName();
            if (sub != null && taskRepository.existsActiveAssignment(sub, node.getCode())) {
                log.debug("🛡️ SpatialSecurity: JIT access granted for node {} via active task assignment for user {}", node.getCode(), sub);
                return true;
            }
        }

        if (node.getProject() == null) {
            return isAllProjectsTier(auth, null);
        }

        return hasProjectPermission(node.getProject().getId(), permissionCode);
    }

    /**
     * Evaluasi otorisasi mutasi kabel serat optik (FiberCable).
     */
    public boolean canAccessCable(UUID cableId, String permissionCode) {
        if (cableId == null || permissionCode == null || permissionCode.isBlank()) {
            return false;
        }

        Optional<FiberCable> cableOpt = fiberCableRepository.findById(cableId);
        if (cableOpt.isEmpty()) {
            return false;
        }

        FiberCable cable = cableOpt.get();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Cek JIT Task Assignment: Teknisi darurat yang ditugaskan menangani tiket kabel ini
        if (auth != null && cable.getCode() != null) {
            String sub = auth.getName();
            if (sub != null && taskRepository.existsActiveAssignment(sub, cable.getCode())) {
                log.debug("🛡️ SpatialSecurity: JIT access granted for cable {} via active task assignment for user {}", cable.getCode(), sub);
                return true;
            }
        }

        if (cable.getProject() == null) {
            return isAllProjectsTier(auth, null);
        }

        return hasProjectPermission(cable.getProject().getId(), permissionCode);
    }

    private boolean isAllProjectsTier(Authentication auth, UUID projectId) {
        if (auth == null) return false;

        // 1. Super Admin
        boolean isSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().toLowerCase().replaceFirst("^role_", "").equals("super_admin"));
        if (isSuperAdmin) {
            return true;
        }

        // 2. Permission all-projects (seeded to admin & supervisor in V34)
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("network.manage.all-projects"));
    }

    private UUID extractUserId(Authentication auth) {
        if (auth == null) return null;
        try {
            if (auth.getPrincipal() instanceof Jwt jwt) {
                String sub = jwt.getSubject();
                if (sub != null) {
                    return UUID.fromString(sub);
                }
            } else if (auth.getName() != null) {
                return UUID.fromString(auth.getName());
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
