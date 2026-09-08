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
    @DisplayName("Should generate 20-character pure lowercase alphabetic slug")
    void testGenerateRawSlug() {
        String slug = generator.generateRawSlug();
        assertThat(slug).hasSize(20);
        assertThat(slug).matches("^[a-z]{20}$");
    }

    @Test
    @DisplayName("Should identify reserved platform keywords")
    void testReservedKeywords() {
        assertThat(generator.isReserved("admin")).isTrue();
        assertThat(generator.isReserved("api")).isTrue();
        assertThat(generator.isReserved("auth")).isTrue();
        assertThat(generator.isReserved("system")).isTrue();
        assertThat(generator.isReserved("gis")).isTrue();
        assertThat(generator.isReserved("ftth-realm")).isTrue();
        assertThat(generator.isReserved("traefik")).isTrue();
        assertThat(generator.isReserved("kong")).isTrue();

        assertThat(generator.isReserved("sukarajin")).isFalse();
        assertThat(generator.isReserved("fiber-nusantara")).isFalse();
        assertThat(generator.isReserved("citra-net")).isFalse();
    }

    @Test
    @DisplayName("Should validate DNS-safe custom slug format")
    void testValidCustomSlug() {
        assertThat(generator.isValidCustomSlug("sukarajin")).isTrue();
        assertThat(generator.isValidCustomSlug("citra-fiber-net")).isTrue();
        assertThat(generator.isValidCustomSlug("k2net-isp")).isTrue();
        assertThat(generator.isValidCustomSlug("pt-solusi-jaringan")).isTrue();

        // Invalid cases
        assertThat(generator.isValidCustomSlug("ab")).isFalse(); // Too short (< 3)
        assertThat(generator.isValidCustomSlug("-invalid")).isFalse(); // Starts with hyphen
        assertThat(generator.isValidCustomSlug("invalid-")).isFalse(); // Ends with hyphen
        assertThat(generator.isValidCustomSlug("invalid--name")).isFalse(); // Double hyphens
        assertThat(generator.isValidCustomSlug("admin")).isFalse(); // Reserved
        assertThat(generator.isValidCustomSlug("Invalid_Upper")).isFalse(); // Underscore and uppercase
        assertThat(generator.isValidCustomSlug("")).isFalse(); // Empty
        assertThat(generator.isValidCustomSlug(null)).isFalse(); // Null
    }

    @Test
    @DisplayName("Should generate unique slug not colliding with existing organizations or aliases")
    void testGenerateUniqueSlug() {
        when(organizationRepository.existsBySlug(anyString())).thenReturn(false);
        when(aliasRepository.existsByOldSlug(anyString())).thenReturn(false);

        String slug = generator.generateUniqueSlug(organizationRepository, aliasRepository);
        assertThat(slug).hasSize(20);
        assertThat(slug).matches("^[a-z]{20}$");
    }
}
