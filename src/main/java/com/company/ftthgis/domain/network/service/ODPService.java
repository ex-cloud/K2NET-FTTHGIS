package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class ODPService {

    private final ODPRepository odpRepository;
    private final ODCRepository odcRepository;

    @Transactional(readOnly = true)
    public Page<ODPDto> getOdps(String search, Pageable pageable) {
        Specification<ODP> spec = (root, query, cb) -> {
            if (!StringUtils.hasText(search))
                return null;
            String likePattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("code")), likePattern));
        };

        return odpRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ODPDto getOdpByCode(String code) {
        return odpRepository.findByCode(code)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("ODP not found: " + code));
    }

    public ODPDto createOdp(ODPDto dto) {
        if (odpRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("ODP Code already exists");
        }

        ODP odp = new ODP();
        updateEntityFromDto(odp, dto);
        odp = odpRepository.save(odp);
        return toDto(odp);
    }

    public ODPDto updateOdp(Long id, ODPDto dto) {
        ODP odp = odpRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODP not found with ID: " + id));

        updateEntityFromDto(odp, dto);
        odp = odpRepository.save(odp);
        return toDto(odp);
    }

    public void deleteOdp(Long id) {
        ODP odp = odpRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODP not found"));
        odpRepository.delete(odp);
    }

    private ODPDto toDto(ODP odp) {
        ODPDto dto = new ODPDto();
        dto.setId(odp.getId());
        dto.setNodeType("ODP");
        dto.setCode(odp.getCode());
        dto.setTotalPort(odp.getTotalPort());
        dto.setUsedPort(odp.getUsedPort());
        dto.setStatus(odp.getStatus());
        dto.setGeom(odp.getGeom());

        if (odp.getOdc() != null) {
            dto.setOdcId(odp.getOdc().getId());
            dto.setOdcName(odp.getOdc().getName());
            dto.setOdcCode(odp.getOdc().getCode());
        }
        return dto;
    }

    private void updateEntityFromDto(ODP odp, ODPDto dto) {
        odp.setCode(dto.getCode());
        odp.setTotalPort(dto.getTotalPort());
        odp.setUsedPort(dto.getUsedPort());

        if (dto.getStatus() != null) {
            odp.setStatus(dto.getStatus());
        } else if (odp.getId() == null) {
            odp.setStatus("PLANNING");
        }

        odp.setGeom(dto.getGeom());

        if (dto.getOdcId() != null) {
            ODC odc = odcRepository.findById(dto.getOdcId())
                    .orElseThrow(() -> new EntityNotFoundException("ODC not found with ID: " + dto.getOdcId()));
            odp.setOdc(odc);
        } else {
            odp.setOdc(null);
        }
    }
}
