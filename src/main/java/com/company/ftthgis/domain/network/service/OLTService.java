package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.OLTDto;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.mapper.NetworkMapper;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OLTService {

    private final OLTRepository oltRepository;
    private final NetworkMapper networkMapper;

    @Transactional(readOnly = true)
    public Page<OLTDto> getOlts(String search, Pageable pageable) {
        log.info("Fetching OLT list with search: {}", search);
        return oltRepository.findAllWithSearch(search, pageable)
                .map(networkMapper::toOLTDto);
    }

    @Transactional(readOnly = true)
    public OLTDto getOltByCode(String code) {
        return oltRepository.findByCode(code)
                .map(networkMapper::toOLTDto)
                .orElseThrow(() -> new RuntimeException("OLT not found with code: " + code));
    }

    @Transactional
    public OLTDto createOlt(OLTDto dto) {
        if (oltRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("OLT with code " + dto.getCode() + " already exists");
        }
        OLT olt = new OLT();
        updateEntityFromDto(olt, dto);
        return networkMapper.toOLTDto(oltRepository.save(olt));
    }

    @Transactional
    public OLTDto updateOlt(Long id, OLTDto dto) {
        OLT olt = oltRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OLT not found with id: " + id));

        updateEntityFromDto(olt, dto);
        return networkMapper.toOLTDto(oltRepository.save(olt));
    }

    @Transactional
    public void deleteOlt(Long id) {
        oltRepository.deleteById(id);
    }

    private void updateEntityFromDto(OLT olt, OLTDto dto) {
        olt.setCode(dto.getCode());
        olt.setName(dto.getName());
        olt.setIpAddress(dto.getIpAddress());
        olt.setSnmpCommunity(dto.getSnmpCommunity());
        olt.setStatus(dto.getStatus());
        if (dto.getGeom() != null) {
            olt.setGeom(dto.getGeom());
        }
    }
}
