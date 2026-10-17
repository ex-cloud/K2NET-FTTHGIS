package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.util.RandomSlugGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RandomSlugGeneratorTest {

    private RandomSlugGenerator generator;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationSlugAliasRepository aliasRepository;

    @BeforeEach
    void setUp() {
        generator = new RandomSlugGenerator();
    }

    @Test
    @DisplayName("Should sanitize organization name to DNS-safe base slug")
    void testSanitizeBaseSlug() {
        assertThat(generator.sanitizeBaseSlug("PT Nusantara Fiber")).isEqualTo("pt-nusantara-fiber");
        assertThat(generator.sanitizeBaseSlug("PT. Max @ Net & Tech!")).isEqualTo("pt-max-net-tech");
        assertThat(generator.sanitizeBaseSlug("   Spaced   Out   ")).isEqualTo("spaced-out");
        assertThat(generator.sanitizeBaseSlug("")).isEqualTo("tenant");
        assertThat(generator.sanitizeBaseSlug(null)).isEqualTo("tenant");
        // Test 24 char truncation
        String longName = "PT Perusahaan Jaringan Fiber Optik Terpadu Indonesia";
        String base = generator.sanitizeBaseSlug(longName);
        assertThat(base.length()).isLessThanOrEqualTo(24);
        assertThat(base).doesNotEndWith("-");
    }

    @Test
    @DisplayName("Should generate alphanumeric suffix of specified length")
    void testGenerateSuffix() {
        String suffix4 = generator.generateSuffix(4);
        assertThat(suffix4).hasSize(4);
        assertThat(suffix4).matches("^[a-z0-9]{4}$");

        String suffix6 = generator.generateSuffix(6);
        assertThat(suffix6).hasSize(6);
        assertThat(suffix6).matches("^[a-z0-9]{6}$");
    }

    @Test
    @DisplayName("Should generate smart slug [name-4char] not colliding with existing orgs or aliases")
    void testGenerateSmartSlug() {
        when(organizationRepository.existsBySlug(anyString())).thenReturn(false);
        when(aliasRepository.existsByOldSlug(anyString())).thenReturn(false);

        String smartSlug = generator.generateSmartSlug("PT Sukarajin Bandung", organizationRepository, aliasRepository);
        assertThat(smartSlug).matches("^pt-sukarajin-bandung-[a-z0-9]{4}$");
    }
}
