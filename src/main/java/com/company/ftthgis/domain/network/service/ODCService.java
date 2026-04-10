package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
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
public class ODCService {

    private final ODCRepository odcRepository;
    private final OLTRepository oltRepository;
    private final StatusPropagationService statusPropagationService;

    @Transactional(readOnly = true)
    public Page<ODCDto> getOdcs(String search, String status, String name, String code, String oltCode, Pageable pageable) {
         Specification<ODC> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            
            if (StringUtils.hasText(search)) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("code")), likePattern),
                        cb.like(cb.lower(root.get("name")), likePattern)
                ));
            }
            
            if (StringUtils.hasText(status)) {
                String likePattern = "%" + status.toUpperCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.upper(root.get("status")), likePattern));
            }
            
            if (StringUtils.hasText(code)) {
                String likePattern = "%" + code.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("code")), likePattern));
            }

            if (StringUtils.hasText(oltCode)) {
                String likePattern = "%" + oltCode.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("olt").get("code")), likePattern),
                        cb.like(cb.lower(root.get("olt").get("name")), likePattern)
                ));
            }

            if (StringUtils.hasText(name)) {
                String likePattern = "%" + name.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("name")), likePattern));
            }
            
            return predicates;
        };

        return odcRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ODCDto getOdcByCode(String code) {
        return odcRepository.findByCode(code)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("ODC not found: " + code));
    }

    public ODCDto createOdc(ODCDto dto) {
        if (odcRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("ODC Code already exists");
        }

        ODC odc = new ODC();
        updateEntityFromDto(odc, dto);
        odc = odcRepository.save(odc);
        return toDto(odc);
    }

    public ODCDto updateOdc(Long id, ODCDto dto) {
        ODC odc = odcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODC not found with ID: " + id));

        String oldStatus = odc.getStatus();
        String newStatus = dto.getStatus();

        updateEntityFromDto(odc, dto);
        odc = odcRepository.save(odc);

        // If status changed, trigger propagation and audit
        if (newStatus != null && !newStatus.equals(oldStatus)) {
            statusPropagationService.handleOdcStatusChange(odc.getCode(), newStatus, dto.getLastNote());
        }

        return toDto(odc);
    }

    public String deleteOdc(Long id) {
        ODC odc = odcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODC not found"));
        String code = odc.getCode();
        odcRepository.delete(odc);
        return code;
    }

    private ODCDto toDto(ODC odc) {
        ODCDto dto = new ODCDto();
        dto.setId(odc.getId());
        dto.setNodeType("ODC");
        dto.setCode(odc.getCode());
        dto.setName(odc.getName());
        dto.setCapacity(odc.getCapacity());
        dto.setUsedCapacity(odc.getUsedCapacity());
        dto.setStatus(odc.getStatus());
        dto.setGeom(odc.getGeom());
        if (odc.getOlt() != null) {
            dto.setOltId(odc.getOlt().getId());
            dto.setOltName(odc.getOlt().getName());
            dto.setOltCode(odc.getOlt().getCode());
        }
        dto.setLastNote(odc.getLastNote());
        return dto;
    }

    private void updateEntityFromDto(ODC odc, ODCDto dto) {
        odc.setCode(dto.getCode());
        odc.setName(dto.getName());
        odc.setCapacity(dto.getCapacity());
        if (dto.getStatus() != null) {
            odc.setStatus(dto.getStatus());
        } else {
            if (odc.getId() == null)
                odc.setStatus("PLANNING"); // Default
        }

        odc.setGeom(dto.getGeom());

        if (dto.getOltId() != null) {
            OLT olt = oltRepository.findById(dto.getOltId())
                    .orElseThrow(() -> new EntityNotFoundException("OLT not found with ID: " + dto.getOltId()));
            odc.setOlt(olt);
        } else {
            odc.setOlt(null);
        }

        if (StringUtils.hasText(dto.getLastNote())) {
            odc.setLastNote(dto.getLastNote());
        }
    }
}
