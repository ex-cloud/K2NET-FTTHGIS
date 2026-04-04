package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.FiberCoreDto;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.FiberCore;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.FiberCoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FiberCoreService {

    private final FiberCoreRepository coreRepository;
    private final FiberCableRepository cableRepository;

    // Standard fiber color sequence (TIA-598)
    private static final String[] FIBER_COLORS = {
        "Blue", "Orange", "Green", "Brown", "Slate",
        "White", "Red", "Black", "Yellow", "Violet",
        "Rose", "Aqua"
    };

    @Transactional(readOnly = true)
    public List<FiberCoreDto> getCoresByCableId(Long cableId) {
        return coreRepository.findByCableIdOrderByCoreNumberAsc(cableId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public FiberCoreDto updateCore(Long coreId, FiberCoreDto dto) {
        FiberCore core = coreRepository.findById(coreId)
                .orElseThrow(() -> new EntityNotFoundException("Core not found: " + coreId));

        if (dto.getStatus() != null) core.setStatus(dto.getStatus());
        if (dto.getColor() != null) core.setColor(dto.getColor());
        if (dto.getAttenuationDb() != null) core.setAttenuationDb(dto.getAttenuationDb());
        if (dto.getFromNodeId() != null) core.setFromNodeId(dto.getFromNodeId());
        if (dto.getToNodeId() != null) core.setToNodeId(dto.getToNodeId());

        core = coreRepository.save(core);
        return toDto(core);
    }

    /**
     * Auto-generate fiber cores for a cable based on its fiberCount.
     * Assigns TIA-598 color codes automatically.
     */
    public List<FiberCoreDto> generateCores(Long cableId) {
        FiberCable cable = cableRepository.findById(cableId)
                .orElseThrow(() -> new EntityNotFoundException("Cable not found: " + cableId));

        int fiberCount = cable.getFiberCount() != null ? cable.getFiberCount() : 12;
        int existingCount = coreRepository.countByCableId(cableId);

        if (existingCount >= fiberCount) {
            throw new IllegalArgumentException(
                "Cable already has " + existingCount + " cores (max " + fiberCount + ")");
        }

        List<FiberCore> cores = new ArrayList<>();
        for (int i = existingCount + 1; i <= fiberCount; i++) {
            FiberCore core = new FiberCore();
            core.setCable(cable);
            core.setCoreNumber(i);
            core.setStatus("AVAILABLE");
            core.setColor(FIBER_COLORS[(i - 1) % FIBER_COLORS.length]);
            core.setAttenuationDb(0.35); // Typical single-mode fiber loss
            cores.add(core);
        }

        List<FiberCore> saved = coreRepository.saveAll(cores);
        log.info("Generated {} fiber cores for cable {} ({})", saved.size(), cableId, cable.getCode());

        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CoreSummary getCoreSummary(Long cableId) {
        int total = coreRepository.countByCableId(cableId);
        int used = coreRepository.countByCableIdAndStatus(cableId, "USED");
        int available = coreRepository.countByCableIdAndStatus(cableId, "AVAILABLE");
        int broken = coreRepository.countByCableIdAndStatus(cableId, "BROKEN");
        return new CoreSummary(total, used, available, broken);
    }

    public record CoreSummary(int total, int used, int available, int broken) {}

    private FiberCoreDto toDto(FiberCore core) {
        FiberCoreDto dto = new FiberCoreDto();
        dto.setId(core.getId());
        dto.setCableId(core.getCable().getId());
        dto.setCableCode(core.getCable().getCode());
        dto.setCoreNumber(core.getCoreNumber());
        dto.setStatus(core.getStatus());
        dto.setColor(core.getColor());
        dto.setAttenuationDb(core.getAttenuationDb());
        dto.setFromNodeId(core.getFromNodeId());
        dto.setToNodeId(core.getToNodeId());
        return dto;
    }
}
