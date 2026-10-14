package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.api.exception.QuotaExceededException;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.service.ProjectQuotaService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ODPServiceTest {

    @Mock
    private ODPRepository odpRepository;

    @Mock
    private ODCRepository odcRepository;

    @Mock
    private StatusPropagationService statusPropagationService;

    @Mock
    private NetworkNodeRepository networkNodeRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private ProjectQuotaService projectQuotaService;

    @InjectMocks
    private ODPService odpService;

    private UUID orgId;
    private Organization organization;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        organization = Organization.builder()
                .id(orgId)
                .name("PT Sukses Fiber")
                .slug("sukses-fiber")
                .build();
    }

    @AfterEach
    void tearDown() {
        OrganizationContext.clear();
        TenantContext.clear();
    }

    @Test
    @DisplayName("createOdp: Berhasil jika kuota mencukupi dan assertCanAllocateOdps lolos")
    void testCreateOdp_SuccessWhenQuotaAllowed() {
        OrganizationContext.setOrganizationId(orgId);

        ODPDto dto = new ODPDto();
        dto.setCode("ODP-TEST-01");
        dto.setStatus("UP");

        when(odpRepository.existsByCode("ODP-TEST-01")).thenReturn(false);
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        doNothing().when(projectQuotaService).assertCanAllocateOdps(organization, 1);

        ODP savedOdp = new ODP();
        savedOdp.setId(UUID.randomUUID());
        savedOdp.setCode("ODP-TEST-01");
        savedOdp.setStatus("UP");

        when(odpRepository.save(any(ODP.class))).thenReturn(savedOdp);

        ODPDto result = odpService.createOdp(dto);

        assertNotNull(result);
        assertEquals("ODP-TEST-01", result.getCode());
        verify(projectQuotaService, times(1)).assertCanAllocateOdps(organization, 1);
        verify(odpRepository, times(1)).save(any(ODP.class));
    }

    @Test
    @DisplayName("createOdp: Melempar QuotaExceededException (HTTP 409) dan tidak menyimpan jika kuota penuh")
    void testCreateOdp_ThrowsQuotaExceededExceptionWhenLimitReached() {
        OrganizationContext.setOrganizationId(orgId);

        ODPDto dto = new ODPDto();
        dto.setCode("ODP-OVERQUOTA");

        when(odpRepository.existsByCode("ODP-OVERQUOTA")).thenReturn(false);
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        doThrow(new QuotaExceededException("ODP_QUOTA_EXCEEDED", "ODP limit reached", 2500, 2500))
                .when(projectQuotaService).assertCanAllocateOdps(organization, 1);

        QuotaExceededException ex = assertThrows(QuotaExceededException.class, () -> odpService.createOdp(dto));

        assertEquals("ODP_QUOTA_EXCEEDED", ex.getErrorCode());
        assertEquals(2500, ex.getCurrent());
        assertEquals(2500, ex.getMax());

        verify(projectQuotaService, times(1)).assertCanAllocateOdps(organization, 1);
        verify(odpRepository, never()).save(any(ODP.class));
    }

    @Test
    @DisplayName("createOdp: Melempar IllegalArgumentException jika kode ODP sudah digunakan")
    void testCreateOdp_DuplicateCodeThrowsException() {
        ODPDto dto = new ODPDto();
        dto.setCode("ODP-DUPLICATE");

        when(odpRepository.existsByCode("ODP-DUPLICATE")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> odpService.createOdp(dto));

        verify(projectQuotaService, never()).assertCanAllocateOdps(any(), anyInt());
        verify(odpRepository, never()).save(any(ODP.class));
    }
}
