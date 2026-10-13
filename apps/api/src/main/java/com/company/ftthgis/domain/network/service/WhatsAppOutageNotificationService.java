package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.OutageBlastResultDto;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.service.TenantPackageSubscriptionService;
import com.company.ftthgis.service.WhatsAppGatewayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * <h1>WhatsAppOutageNotificationService</h1>
 * Handles automated WhatsApp blast notifications when network fiber outages occur.
 * Validates tenant entitlement for package PKG_WA_OUTAGE (feature.notification.wa_blast)
 * before dispatching messages to ftth-whatsapp-gateway (port 5005).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppOutageNotificationService {

    public static final String OUTAGE_FEATURE_KEY = "feature.notification.wa_blast";
    public static final String OUTAGE_PACKAGE_CODE = "PKG_WA_OUTAGE";

    private final WhatsAppGatewayClient whatsAppGatewayClient;
    private final TenantPackageSubscriptionService subscriptionService;
    private final CustomerRepository customerRepository;
    private final ODPRepository odpRepository;
    private final ODCRepository odcRepository;
    private final OrganizationRepository organizationRepository;

    /**
     * Trigger an automated WhatsApp outage broadcast for a specified network asset (ODC or ODP).
     *
     * @param assetCode Code of the affected node (e.g. ODC-01, ODP-01)
     * @param assetType Type of node (ODC or ODP)
     * @param reason The incident reason (e.g. FIBERCUT, DOWN)
     * @return OutageBlastResultDto containing execution and queue status
     */
    public OutageBlastResultDto notifyOutageForAsset(String assetCode, String assetType, String reason) {
        Organization org = resolveOrganizationForAsset(assetCode, assetType);
        if (org == null) {
            log.warn("⚠️ [WA-OUTAGE] Could not resolve Organization for asset {} ({})", assetCode, assetType);
            return OutageBlastResultDto.builder()
                    .status("SKIPPED")
                    .reason("ORGANIZATION_NOT_FOUND")
                    .message("Asset organization could not be determined.")
                    .affectedCustomersCount(0)
                    .queuedCount(0)
                    .build();
        }

        List<Customer> affectedCustomers = findDownstreamCustomers(assetCode, assetType);
        return triggerOutageBlast(org, assetCode, assetType, affectedCustomers, reason);
    }

    /**
     * Core blast orchestrator. Validates entitlement, formats Indonesian message template,
     * and sends blast payload to Go WhatsApp gateway.
     */
    public OutageBlastResultDto triggerOutageBlast(
            Organization org,
            String assetCode,
            String assetType,
            List<Customer> affectedCustomers,
            String reason) {

        int totalAffected = affectedCustomers != null ? affectedCustomers.size() : 0;

        // 1. Entitlement Verification (Package PKG_WA_OUTAGE)
        boolean hasEntitlement = subscriptionService.hasActiveFeature(org.getId(), OUTAGE_FEATURE_KEY);
        if (!hasEntitlement) {
            log.info("📢 [WA-OUTAGE] Tenant '{}' ({}) does NOT have active entitlement '{}'. Outage WhatsApp blast skipped. (Requires package: {})",
                    org.getName(), org.getSlug(), OUTAGE_FEATURE_KEY, OUTAGE_PACKAGE_CODE);

            return OutageBlastResultDto.builder()
                    .status("SKIPPED")
                    .reason("NO_ACTIVE_ENTITLEMENT")
                    .requiredPackage(OUTAGE_PACKAGE_CODE)
                    .message("Tenant does not have an active subscription for PKG_WA_OUTAGE (" + OUTAGE_FEATURE_KEY + ").")
                    .affectedCustomersCount(totalAffected)
                    .queuedCount(0)
                    .build();
        }

        if (affectedCustomers == null || affectedCustomers.isEmpty()) {
            log.info("ℹ️ [WA-OUTAGE] No downstream customers found under asset {} ({})", assetCode, assetType);
            return OutageBlastResultDto.builder()
                    .status("SKIPPED")
                    .reason("NO_DOWNSTREAM_CUSTOMERS")
                    .message("No downstream customers connected to the impacted asset.")
                    .affectedCustomersCount(0)
                    .queuedCount(0)
                    .build();
        }

        // 2. Filter customers with valid phone numbers
        List<WhatsAppGatewayClient.BlastMessageItem> messages = new ArrayList<>();
        for (Customer c : affectedCustomers) {
            String phone = c.getPhone();
            if (phone == null || phone.isBlank()) {
                continue;
            }

            String cleanPhone = phone.replaceAll("\\D", "");
            if (cleanPhone.startsWith("0")) {
                cleanPhone = "62" + cleanPhone.substring(1);
            }
            String formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : "+" + cleanPhone;

            String bodyText = formatOutageMessage(
                    c.getName() != null ? c.getName() : "Pelanggan Terhormat",
                    assetCode,
                    assetType,
                    reason
            );

            messages.add(WhatsAppGatewayClient.BlastMessageItem.builder()
                    .phone(formattedPhone)
                    .message(bodyText)
                    .language("id")
                    .build()
            );
        }

        if (messages.isEmpty()) {
            log.warn("⚠️ [WA-OUTAGE] None of the {} affected customers have a registered WhatsApp phone number.", totalAffected);
            return OutageBlastResultDto.builder()
                    .status("SKIPPED")
                    .reason("NO_VALID_PHONE_RECIPIENTS")
                    .message("Affected customers detected but none have a registered contact number.")
                    .affectedCustomersCount(totalAffected)
                    .queuedCount(0)
                    .build();
        }

        // 3. Dispatch to Gateway
        Optional<WhatsAppGatewayClient.BlastResponseData> blastResult =
                whatsAppGatewayClient.sendBlast(org.getSlug(), messages);

        if (blastResult.isPresent()) {
            int queuedCount = blastResult.get().getCount() > 0 ? blastResult.get().getCount() : messages.size();
            log.info("✅ [WA-OUTAGE] Successfully queued {} WhatsApp outage alerts for tenant {}", queuedCount, org.getSlug());

            return OutageBlastResultDto.builder()
                    .status("QUEUED")
                    .reason("SUCCESS")
                    .message("Successfully queued " + queuedCount + " outage alerts to WhatsApp gateway.")
                    .affectedCustomersCount(totalAffected)
                    .queuedCount(queuedCount)
                    .build();
        } else {
            log.error("❌ [WA-OUTAGE] Failed dispatching blast to gateway for tenant {}", org.getSlug());
            return OutageBlastResultDto.builder()
                    .status("FAILED")
                    .reason("GATEWAY_DISPATCH_FAILED")
                    .message("ftth-whatsapp-gateway rejected or could not process blast request.")
                    .affectedCustomersCount(totalAffected)
                    .queuedCount(0)
                    .build();
        }
    }

    /**
     * Resolves all downstream Customers under an ODC or ODP.
     */
    public List<Customer> findDownstreamCustomers(String assetCode, String assetType) {
        List<Customer> results = new ArrayList<>();
        if ("ODP".equalsIgnoreCase(assetType)) {
            odpRepository.findByCode(assetCode).ifPresent(odp -> {
                results.addAll(customerRepository.findByOdp(odp));
            });
        } else if ("ODC".equalsIgnoreCase(assetType)) {
            odcRepository.findByCode(assetCode).ifPresent(odc -> {
                List<ODP> childOdps = odpRepository.findByOdc(odc);
                for (ODP odp : childOdps) {
                    results.addAll(customerRepository.findByOdp(odp));
                }
            });
        }
        return results;
    }

    private Organization resolveOrganizationForAsset(String assetCode, String assetType) {
        if ("ODC".equalsIgnoreCase(assetType)) {
            return odcRepository.findByCode(assetCode)
                    .map(ODC::getOrganization)
                    .orElse(null);
        } else if ("ODP".equalsIgnoreCase(assetType)) {
            return odpRepository.findByCode(assetCode)
                    .map(ODP::getOrganization)
                    .orElse(null);
        }
        return null;
    }

    private String formatOutageMessage(String customerName, String assetCode, String assetType, String reason) {
        return String.format(
                "⚠️ *Pemberitahuan Gangguan Fiber Optik (K2NET)*\n\n" +
                "Halo *%s*,\n\n" +
                "Terdeteksi gangguan jaringan fiber optik yang berpotensi memengaruhi koneksi internet di lokasi Anda:\n" +
                "• Klaster Node: *%s* (%s)\n" +
                "• Indikasi Gangguan: *%s*\n\n" +
                "Tim teknisi lapangan saat ini sedang dalam perjalanan untuk penanganan darurat dan splicing fiber.\n" +
                "Layanan akan segera dipulihkan secepatnya.\n\n" +
                "Terima kasih atas kesabaran dan pengertian Anda.",
                customerName,
                assetCode,
                assetType,
                reason != null && !reason.isBlank() ? reason : "FIBERCUT"
        );
    }
}
