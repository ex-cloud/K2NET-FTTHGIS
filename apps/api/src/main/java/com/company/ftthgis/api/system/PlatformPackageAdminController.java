package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.CreatePackageRequest;
import com.company.ftthgis.api.system.dto.GrantPackageRequest;
import com.company.ftthgis.api.system.dto.PackageKpiOverviewDto;
import com.company.ftthgis.api.system.dto.UpdatePackageRequest;
import com.company.ftthgis.api.tenant.dto.PackageResponseDto;
import com.company.ftthgis.api.tenant.dto.TenantPackageSubscriptionDto;
import com.company.ftthgis.service.PlatformPackageService;
import com.company.ftthgis.service.TenantPackageSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller Platform Super Admin untuk Tata Kelola Master Paket & Add-on Marketplace.
 *
 * <p>Mendukung:
 * <ul>
 *   <li>Metrik adopsi paket & estimasi MRR add-on</li>
 *   <li>Katalog master 12 kategori modul</li>
 *   <li>Manajemen publikasi, harga, tier minimal, dan prasyarat</li>
 *   <li>Pemberian hak akses gratis POC (Proof of Concept) kepada tenant terpilih</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/system/packages")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PlatformPackageAdminController {

    private final PlatformPackageService packageService;
    private final TenantPackageSubscriptionService subscriptionService;

    /**
     * Mengambil ringkasan metrik KPI paket add-on untuk Command Center Super Admin.
     */
    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('system.packages.view') or hasAuthority('system.packages.manage')")
    public ResponseEntity<PackageKpiOverviewDto> getOverview() {
        return ResponseEntity.ok(packageService.getKpiOverview());
    }

    /**
     * Mengambil seluruh katalog master paket platform (termasuk yang belum diterbitkan).
     */
    @GetMapping
    @PreAuthorize("hasAuthority('system.packages.view') or hasAuthority('system.packages.manage')")
    public ResponseEntity<List<PackageResponseDto>> getAllPackages() {
        return ResponseEntity.ok(packageService.getAllPackagesAdmin());
    }

    /**
     * Mengambil seluruh langganan paket aktif di platform untuk Super Admin.
     */
    @GetMapping("/subscriptions")
    @PreAuthorize("hasAuthority('system.packages.view') or hasAuthority('system.packages.manage')")
    public ResponseEntity<List<TenantPackageSubscriptionDto>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptionsAdmin());
    }

    /**
     * Mengambil detail satu paket berdasarkan ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('system.packages.view') or hasAuthority('system.packages.manage')")
    public ResponseEntity<PackageResponseDto> getPackageById(@PathVariable UUID id) {
        return ResponseEntity.ok(packageService.getPackageById(id));
    }

    /**
     * Membuat paket add-on baru di katalog platform.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('system.packages.manage')")
    public ResponseEntity<PackageResponseDto> createPackage(@Valid @RequestBody CreatePackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(packageService.createPackage(request));
    }

    /**
     * Memperbarui konfigurasi paket yang sudah ada.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('system.packages.manage')")
    public ResponseEntity<PackageResponseDto> updatePackage(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePackageRequest request) {
        return ResponseEntity.ok(packageService.updatePackage(id, request));
    }

    /**
     * Toggle status publikasi paket di marketplace tenant.
     */
    @PatchMapping("/{id}/toggle-publish")
    @PreAuthorize("hasAuthority('system.packages.manage')")
    public ResponseEntity<PackageResponseDto> togglePublish(@PathVariable UUID id) {
        return ResponseEntity.ok(packageService.togglePublish(id));
    }

    /**
     * Menghapus paket dari katalog platform.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system.packages.manage')")
    public ResponseEntity<Void> deletePackage(@PathVariable UUID id) {
        packageService.deletePackage(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Memberikan paket gratis POC (Proof of Concept) kepada tenant tertentu oleh Super Admin.
     */
    @PostMapping("/organizations/{orgId}/grant")
    @PreAuthorize("hasAuthority('system.packages.manage')")
    public ResponseEntity<TenantPackageSubscriptionDto> grantPackage(
            @PathVariable UUID orgId,
            @Valid @RequestBody GrantPackageRequest request) {
        String adminUser = resolveCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subscriptionService.grantPackageManually(orgId, request, adminUser));
    }

    private String resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
            return auth.getName();
        }
        return "SUPER_ADMIN";
    }
}
