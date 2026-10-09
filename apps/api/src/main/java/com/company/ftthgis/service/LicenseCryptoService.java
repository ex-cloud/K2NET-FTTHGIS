package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Layanan Kriptografi Lisensi K2NET FTTH GIS Multi-Tenant.
 *
 * <p>Fitur Utama:
 * <ul>
 *   <li>Penerbitan kunci token kanonikal: {@code K2NET-{TIER}-{RANDOM_HEX8}-{CHECKSUM4}}</li>
 *   <li>Penandatanganan digital HMAC-SHA256 untuk integritas non-repudiation token & payload</li>
 *   <li>Verifikasi checksum deterministik instan tanpa ketergantungan database</li>
 *   <li>Generator dan parser sertifikat lisensi offline (*Air-Gapped Certificate* {@code .lic})</li>
 *   <li>Validasi hardware machine fingerprint untuk instalasi intranet tertutup</li>
 * </ul>
 */
@Service
@Slf4j
public class LicenseCryptoService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String CERT_HEADER = "-----BEGIN K2NET LICENSE CERTIFICATE-----";
    private static final String CERT_FOOTER = "-----END K2NET LICENSE CERTIFICATE-----";
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final byte[] secretKeyBytes;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ObjectMapper objectMapper;

    public LicenseCryptoService(
            @Value("${app.security.encryption-key:${AUTH_SECRET:ftth-gis-master-secret-key-32b!!}}") String rawKey,
            ObjectMapper objectMapper
    ) {
        this.secretKeyBytes = (rawKey != null && !rawKey.trim().isEmpty())
                ? rawKey.getBytes(StandardCharsets.UTF_8)
                : "ftth-gis-master-secret-key-32b!!".getBytes(StandardCharsets.UTF_8);
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Menghasilkan format kunci lisensi kanonikal: {@code K2NET-{TIER}-{RANDOM_HEX8}-{CHECKSUM4}}
     *
     * @param tier Nama tingkatan paket (STARTER, PRO, ENTERPRISE, FREE)
     * @return String lisensi terformat (misal: {@code K2NET-PRO-9F4D2A1C-7B8E})
     */
    public String generateLicenseKey(String tier) {
        String cleanTier = normalizeTierCode(tier);
        byte[] randomBytes = new byte[4];
        secureRandom.nextBytes(randomBytes);
        String randomHex = bytesToHex(randomBytes).toUpperCase(Locale.ROOT);

        String prefix = "K2NET-" + cleanTier + "-" + randomHex;
        String checksum = calculateChecksum4(prefix);

        return prefix + "-" + checksum;
    }

    /**
     * Memverifikasi validitas checksum token kunci lisensi secara deterministik tanpa query DB.
     *
     * @param licenseKey Kunci lisensi yang diuji
     * @return {@code true} jika format dan checksum cocok dengan secret platform
     */
    public boolean verifyLicenseChecksum(String licenseKey) {
        if (licenseKey == null || licenseKey.trim().isEmpty()) {
            return false;
        }

        String[] parts = licenseKey.trim().toUpperCase(Locale.ROOT).split("-");
        // Diharapkan format 4 bagian: K2NET, TIER, RANDOM_HEX8, CHECKSUM4
        if (parts.length != 4 || !"K2NET".equals(parts[0])) {
            return false;
        }

        String prefix = parts[0] + "-" + parts[1] + "-" + parts[2];
        String providedChecksum = parts[3];
        String expectedChecksum = calculateChecksum4(prefix);

        return expectedChecksum.equalsIgnoreCase(providedChecksum);
    }

    /**
     * Menandatangani metadata lengkap lisensi untuk menghasilkan tanda tangan digital HMAC-SHA256.
     *
     * @param orgId UUID organisasi
     * @param planName Nama paket langganan
     * @param licenseKey Kunci lisensi
     * @param validFrom Tanggal mulai aktif
     * @param validUntil Tanggal kedaluwarsa
     * @param machineFingerprint Hardware fingerprint (opsional)
     * @return Digest string heksadesimal lengkap (64 karakter)
     */
    public String signLicenseMetadata(
            UUID orgId,
            String planName,
            String licenseKey,
            LocalDateTime validFrom,
            LocalDateTime validUntil,
            String machineFingerprint
    ) {
        String payload = String.join("|",
                orgId != null ? orgId.toString() : "",
                planName != null ? planName.toUpperCase(Locale.ROOT) : "",
                licenseKey != null ? licenseKey.toUpperCase(Locale.ROOT) : "",
                validFrom != null ? validFrom.format(ISO_FORMATTER) : "",
                validUntil != null ? validUntil.format(ISO_FORMATTER) : "",
                machineFingerprint != null ? machineFingerprint : "CLOUD_ANY"
        );

        return computeHmacSha256Hex(payload);
    }

    /**
     * Memverifikasi tanda tangan digital metadata lisensi terhadap nilai aktual.
     */
    public boolean verifyLicenseSignature(
            UUID orgId,
            String planName,
            String licenseKey,
            LocalDateTime validFrom,
            LocalDateTime validUntil,
            String machineFingerprint,
            String signature
    ) {
        if (signature == null || signature.trim().isEmpty()) {
            return false;
        }
        String expectedSig = signLicenseMetadata(orgId, planName, licenseKey, validFrom, validUntil, machineFingerprint);
        return expectedSig.equalsIgnoreCase(signature.trim());
    }

    /**
     * Menghasilkan berkas sertifikat lisensi offline bertanda tangan digital (.lic).
     *
     * @param license Entitas lisensi
     * @param org Organisasi tenant
     * @return Teks terformat Base64 dengan header & footer sertifikat K2NET
     */
    public String generateOfflineCertificate(TenantLicense license, Organization org) {
        try {
            OfflineLicensePayload payload = OfflineLicensePayload.builder()
                    .version("1.0")
                    .format("K2NET_OFFLINE_LICENSE")
                    .licenseKey(license.getLicenseKey())
                    .organizationId(org.getId().toString())
                    .organizationSlug(org.getSlug())
                    .organizationName(org.getName())
                    .planName(license.getSubscriptionPlan() != null ? license.getSubscriptionPlan().getName() : "ENTERPRISE")
                    .issuedAt(LocalDateTime.now().format(ISO_FORMATTER))
                    .validFrom(license.getValidFrom().format(ISO_FORMATTER))
                    .validUntil(license.getValidUntil().format(ISO_FORMATTER))
                    .machineFingerprint(license.getMachineFingerprint())
                    .maxProjects(license.getOverrideMaxProjects())
                    .maxOdps(license.getOverrideMaxOdps())
                    .maxOdcs(license.getOverrideMaxOdcs())
                    .maxCustomers(license.getOverrideMaxCustomers())
                    .maxStorageGb(license.getOverrideMaxStorageGb())
                    .featureSsoEnabled(license.isFeatureSsoEnabled())
                    .featureApiEnabled(license.isFeatureApiEnabled())
                    .featureAiCopilotEnabled(license.isFeatureAiCopilotEnabled())
                    .featureCustomDomainEnabled(license.isFeatureCustomDomainEnabled())
                    .build();

            // Hitung signature untuk payload
            String rawPayloadForSig = computePayloadSignatureContent(payload);
            payload.setSignature(computeHmacSha256Hex(rawPayloadForSig));

            String json = objectMapper.writeValueAsString(payload);
            String base64Cert = Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(json.getBytes(StandardCharsets.UTF_8));

            return CERT_HEADER + "\n" + base64Cert + "\n" + CERT_FOOTER;
        } catch (Exception e) {
            log.error("Failed to generate offline license certificate: {}", e.getMessage(), e);
            throw new IllegalStateException("Gagal menerbitkan sertifikat lisensi offline: " + e.getMessage(), e);
        }
    }

    /**
     * Mem-parsing dan memverifikasi sertifikat lisensi offline (.lic).
     *
     * @param certContent Isi sertifikat mentah (dengan atau tanpa banner)
     * @return {@code OfflineLicensePayload} jika sertifikat valid dan tidak dimanipulasi
     * @throws IllegalArgumentException jika sertifikat rusak, tidak valid, atau dimanipulasi
     */
    public OfflineLicensePayload parseAndVerifyOfflineCertificate(String certContent) {
        if (certContent == null || certContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Konten berkas sertifikat lisensi tidak boleh kosong.");
        }

        try {
            // Bersihkan banner jika ada
            String cleanBase64 = certContent
                    .replace(CERT_HEADER, "")
                    .replace(CERT_FOOTER, "")
                    .replaceAll("\\s+", "");

            byte[] decodedBytes = Base64.getDecoder().decode(cleanBase64);
            OfflineLicensePayload payload = objectMapper.readValue(decodedBytes, OfflineLicensePayload.class);

            if (!"K2NET_OFFLINE_LICENSE".equals(payload.getFormat())) {
                throw new IllegalArgumentException("Format sertifikat lisensi tidak dikenal.");
            }

            // Verifikasi checksum kunci
            if (!verifyLicenseChecksum(payload.getLicenseKey())) {
                throw new IllegalArgumentException("Kunci lisensi pada sertifikat memiliki checksum tidak valid.");
            }

            // Verifikasi signature konten
            String expectedSig = computeHmacSha256Hex(computePayloadSignatureContent(payload));
            if (!expectedSig.equalsIgnoreCase(payload.getSignature())) {
                log.warn("⚠️ TAMPERING DETECTED: Offline license signature mismatch for key {}", payload.getLicenseKey());
                throw new IllegalArgumentException("Integritas sertifikat lisensi gagal diverifikasi: data telah dimodifikasi (tampered).");
            }

            return payload;
        } catch (IllegalArgumentException iae) {
            throw iae;
        } catch (Exception e) {
            log.error("Failed to parse and verify offline license certificate: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Berkas sertifikat lisensi tidak valid atau rusak: " + e.getMessage(), e);
        }
    }

    /**
     * Memverifikasi kesesuaian hardware machine fingerprint.
     */
    public boolean verifyMachineFingerprint(String expectedFingerprint, String actualFingerprint) {
        if (expectedFingerprint == null || expectedFingerprint.trim().isEmpty()) {
            return true; // Jika lisensi tidak mengikat fingerprint (cloud/unrestricted), selalu izinkan
        }
        if (actualFingerprint == null) {
            return false;
        }
        return expectedFingerprint.trim().equalsIgnoreCase(actualFingerprint.trim());
    }

    // ── Internal Helpers ────────────────────────────────────────────────────

    private String calculateChecksum4(String text) {
        String fullHex = computeHmacSha256Hex(text);
        return fullHex.substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private String computeHmacSha256Hex(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(secretKeyBytes, HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256: " + e.getMessage(), e);
        }
    }

    private String computePayloadSignatureContent(OfflineLicensePayload p) {
        return String.join("##",
                p.getVersion() != null ? p.getVersion() : "",
                p.getLicenseKey() != null ? p.getLicenseKey() : "",
                p.getOrganizationId() != null ? p.getOrganizationId() : "",
                p.getPlanName() != null ? p.getPlanName() : "",
                p.getValidFrom() != null ? p.getValidFrom() : "",
                p.getValidUntil() != null ? p.getValidUntil() : "",
                p.getMachineFingerprint() != null ? p.getMachineFingerprint() : ""
        );
    }

    private String normalizeTierCode(String tier) {
        if (tier == null) return "PRO";
        String upper = tier.trim().toUpperCase(Locale.ROOT);
        return switch (upper) {
            case "ENTERPRISE", "ENT" -> "ENT";
            case "STARTER" -> "STARTER";
            case "FREE", "TRIAL" -> "FREE";
            default -> "PRO";
        };
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ── DTO Model Sertifikat Offline ────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OfflineLicensePayload {
        private String version;
        private String format;
        private String licenseKey;
        private String organizationId;
        private String organizationSlug;
        private String organizationName;
        private String planName;
        private String issuedAt;
        private String validFrom;
        private String validUntil;
        private String machineFingerprint;

        // Quotas
        private Integer maxProjects;
        private Integer maxOdps;
        private Integer maxOdcs;
        private Integer maxCustomers;
        private Integer maxStorageGb;

        // Features
        private boolean featureSsoEnabled;
        private boolean featureApiEnabled;
        private boolean featureAiCopilotEnabled;
        private boolean featureCustomDomainEnabled;

        // Cryptographic Seal
        private String signature;
    }
}
