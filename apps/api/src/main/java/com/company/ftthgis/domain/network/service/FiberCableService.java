package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.FiberCableDto;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.mapper.NetworkMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FiberCableService {

    private final FiberCableRepository fiberCableRepository;
    private final NetworkMapper networkMapper;

    @Transactional(readOnly = true)
    public Page<FiberCableDto> getCables(Pageable pageable) {
        return fiberCableRepository.findAll(pageable).map(networkMapper::toFiberCableDto);
    }

    @Transactional(readOnly = true)
    public FiberCableDto getCableByCode(String code) {
        return fiberCableRepository.findByCode(code)
                .map(networkMapper::toFiberCableDto)
                .orElseThrow(() -> new EntityNotFoundException("Cable not found: " + code));
    }

    public FiberCableDto createCable(FiberCableDto dto) {
        if (fiberCableRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Cable Code already exists: " + dto.getCode());
        }

        FiberCable cable = new FiberCable();
        updateEntityFromDto(cable, dto);
        cable = fiberCableRepository.save(cable);
        return networkMapper.toFiberCableDto(cable);
    }

    public FiberCableDto updateCable(UUID id, FiberCableDto dto) {
        FiberCable cable = fiberCableRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cable not found with ID: " + id));

        updateEntityFromDto(cable, dto);
        cable = fiberCableRepository.save(cable);
        return networkMapper.toFiberCableDto(cable);
    }

    public String deleteCable(UUID id) {
        FiberCable cable = fiberCableRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cable not found"));
        String code = cable.getCode();
        fiberCableRepository.delete(cable);
        return code;
    }

    private void updateEntityFromDto(FiberCable cable, FiberCableDto dto) {
        cable.setCode(dto.getCode());
        cable.setFiberCount(dto.getFiberCount());
        cable.setStatus(dto.getStatus());
        cable.setLengthMeters(dto.getLengthMeters());
        
        if (dto.getGeom() != null) {
            cable.setGeometry(dto.getGeom());
        }

        if (dto.getLastNote() != null && !dto.getLastNote().isBlank()) {
            cable.setLastNote(dto.getLastNote());
        }
    }
}
