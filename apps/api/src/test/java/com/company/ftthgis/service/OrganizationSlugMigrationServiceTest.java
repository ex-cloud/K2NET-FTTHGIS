package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.util.RandomSlugGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationSlugMigrationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationSlugAliasRepository organizationSlugAliasRepository;

    @Mock
    private RandomSlugGenerator randomSlugGenerator;

    @Mock
    private AuditLoggingService auditLoggingService;

    @InjectMocks
    private OrganizationSlugMigrationService migrationService;

    private Organization proOrg;
    private Organization freeOrg;
    private UUID orgId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();

        SubscriptionPlan proPlan = SubscriptionPlan.builder()
                .name("PRO")
                .hasSso(true)
                .build();

        SubscriptionPlan freePlan = SubscriptionPlan.builder()
                .name("FREE")
                .hasSso(false)
                .build();

        proOrg = Organization.builder()
                .id(orgId)
                .name("PT Sukarajin Telematika")
                .slug("a7x9b2q1k4m8p3n5v8w2")
                .realmKey("realm-immutable-key-12345")
                .slugType("RANDOM")
                .subscriptionPlan(proPlan)
                .build();

        freeOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Free Trial Org")
                .slug("freeorgtrial20charsxx")
                .realmKey("realm-free-key-99999")
                .slugType("RANDOM")
                .subscriptionPlan(freePlan)
                .build();
    }

    @Test
    @DisplayName("Should reject slug migration for FREE plan")
    void testFreePlanRejected() {
        when(organizationRepository.findById(freeOrg.getId())).thenReturn(Optional.of(freeOrg));
        when(randomSlugGenerator.isValidCustomSlug(anyString())).thenReturn(true);
        when(randomSlugGenerator.isReserved(anyString())).thenReturn(false);

        assertThatThrownBy(() -> migrationService.migrateSlug(freeOrg.getId(), "custom-subdomain", "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Starter (Free) tier is locked");
    }

    @Test
    @DisplayName("Should reject reserved platform keywords")
    void testReservedSlugRejected() {
        when(organizationRepository.findById(proOrg.getId())).thenReturn(Optional.of(proOrg));
        when(randomSlugGenerator.isReserved("admin")).thenReturn(true);

        assertThatThrownBy(() -> migrationService.migrateSlug(proOrg.getId(), "admin", "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reserved platform keyword");
    }

    @Test
    @DisplayName("Should reject slug if already taken by another organization")
    void testTakenSlugRejected() {
        when(organizationRepository.findById(proOrg.getId())).thenReturn(Optional.of(proOrg));
        when(randomSlugGenerator.isValidCustomSlug("fiber-corp")).thenReturn(true);
        when(randomSlugGenerator.isReserved("fiber-corp")).thenReturn(false);
        when(organizationRepository.existsBySlug("fiber-corp")).thenReturn(true);

        assertThatThrownBy(() -> migrationService.migrateSlug(proOrg.getId(), "fiber-corp", "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already in use by another organization");
    }

    @Test
    @DisplayName("Should successfully migrate slug while preserving immutable realmKey and recording alias")
    void testSuccessfulMigrationPreservesRealmKey() {
        when(organizationRepository.findById(proOrg.getId())).thenReturn(Optional.of(proOrg));
        when(randomSlugGenerator.isValidCustomSlug("sukarajin")).thenReturn(true);
        when(randomSlugGenerator.isReserved("sukarajin")).thenReturn(false);
        when(organizationRepository.existsBySlug("sukarajin")).thenReturn(false);
        when(organizationSlugAliasRepository.existsByOldSlug("sukarajin")).thenReturn(false);
        when(organizationRepository.saveAndFlush(any(Organization.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = migrationService.migrateSlug(proOrg.getId(), "sukarajin", "admin");

        assertThat(result.get("status")).isEqualTo("MIGRATED");
        assertThat(result.get("newSlug")).isEqualTo("sukarajin");
        assertThat(result.get("previousSlug")).isEqualTo("a7x9b2q1k4m8p3n5v8w2");
        assertThat(result.get("realmKey")).isEqualTo("realm-immutable-key-12345");
        assertThat(result.get("newDomain")).isEqualTo("sukarajin-gis.kdua.net");

        // Verify that realmKey is PRESERVED identically (No user UUID mutation risk)
        assertThat(proOrg.getRealmKey()).isEqualTo("realm-immutable-key-12345");
        assertThat(proOrg.getSlug()).isEqualTo("sukarajin");

        // Verify historical alias was recorded
        verify(organizationSlugAliasRepository).save(any(OrganizationSlugAlias.class));
        verify(organizationRepository).saveAndFlush(proOrg);
    }
}
