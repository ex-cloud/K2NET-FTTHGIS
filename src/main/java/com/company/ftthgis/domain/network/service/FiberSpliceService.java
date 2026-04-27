package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.FiberSpliceDto;
import com.company.ftthgis.domain.network.entity.FiberCore;
import com.company.ftthgis.domain.network.entity.FiberSplice;
import com.company.ftthgis.domain.network.entity.SplitterPort;
import com.company.ftthgis.domain.network.repository.FiberCoreRepository;
import com.company.ftthgis.domain.network.repository.FiberSpliceRepository;
import com.company.ftthgis.domain.network.repository.SplitterPortRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FiberSpliceService {

    private final FiberSpliceRepository spliceRepository;
    private final FiberCoreRepository coreRepository;
    private final SplitterPortRepository portRepository;

    @Transactional(readOnly = true)
    public List<FiberSpliceDto> getSplicesByNodeId(UUID nodeId) {
        return spliceRepository.findByNodeId(nodeId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FiberSpliceDto> getSplicesByPortId(UUID portId) {
        return spliceRepository.findByPortId(portId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Create a new splice connection.
     * This links two fiber cores through two ports, representing a physical splice point.
     */
    public FiberSpliceDto createSplice(FiberSpliceDto dto) {
        FiberCore fromCore = coreRepository.findById(dto.getFromCoreId())
                .orElseThrow(() -> new EntityNotFoundException("Source core not found: " + dto.getFromCoreId()));
        FiberCore toCore = coreRepository.findById(dto.getToCoreId())
                .orElseThrow(() -> new EntityNotFoundException("Target core not found: " + dto.getToCoreId()));

        // Mark cores as USED
        fromCore.setStatus("USED");
        toCore.setStatus("USED");
        coreRepository.save(fromCore);
        coreRepository.save(toCore);

        // Mark ports as USED if specified
        if (dto.getFromPortId() != null) {
            SplitterPort fromPort = portRepository.findById(dto.getFromPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Source port not found: " + dto.getFromPortId()));
            fromPort.setStatus("USED");
            fromPort.setConnectedCore(fromCore);
            portRepository.save(fromPort);
        }
        if (dto.getToPortId() != null) {
            SplitterPort toPort = portRepository.findById(dto.getToPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Target port not found: " + dto.getToPortId()));
            toPort.setStatus("USED");
            toPort.setConnectedCore(toCore);
            portRepository.save(toPort);
        }

        // Create splice record
        FiberSplice splice = new FiberSplice();
        splice.setFromCore(fromCore);
        splice.setToCore(toCore);
        splice.setFromPortId(dto.getFromPortId());
        splice.setToPortId(dto.getToPortId());
        splice.setSpliceType(dto.getSpliceType() != null ? dto.getSpliceType() : "FUSION");
        splice.setLossDb(dto.getLossDb());
        splice.setNotes(dto.getNotes());

        splice = spliceRepository.save(splice);
        log.info("Created splice: Core #{} ({}) → Core #{} ({})",
                fromCore.getCoreNumber(), fromCore.getCable().getCode(),
                toCore.getCoreNumber(), toCore.getCable().getCode());

        return toDto(splice);
    }

    /**
     * Delete a splice and free up the associated cores and ports.
     */
    public void deleteSplice(UUID spliceId) {
        FiberSplice splice = spliceRepository.findById(spliceId)
                .orElseThrow(() -> new EntityNotFoundException("Splice not found: " + spliceId));

        // Free cores
        splice.getFromCore().setStatus("AVAILABLE");
        splice.getToCore().setStatus("AVAILABLE");
        coreRepository.save(splice.getFromCore());
        coreRepository.save(splice.getToCore());

        // Free ports
        if (splice.getFromPortId() != null) {
            portRepository.findById(splice.getFromPortId()).ifPresent(port -> {
                port.setStatus("AVAILABLE");
                port.setConnectedCore(null);
                portRepository.save(port);
            });
        }
        if (splice.getToPortId() != null) {
            portRepository.findById(splice.getToPortId()).ifPresent(port -> {
                port.setStatus("AVAILABLE");
                port.setConnectedCore(null);
                portRepository.save(port);
            });
        }

        spliceRepository.delete(splice);
        log.info("Deleted splice {} and freed associated cores/ports", spliceId);
    }

    private FiberSpliceDto toDto(FiberSplice splice) {
        FiberSpliceDto dto = new FiberSpliceDto();
        dto.setId(splice.getId());
        dto.setFromCoreId(splice.getFromCore().getId());
        dto.setToCoreId(splice.getToCore().getId());
        dto.setFromPortId(splice.getFromPortId());
        dto.setToPortId(splice.getToPortId());
        dto.setSpliceType(splice.getSpliceType());
        dto.setLossDb(splice.getLossDb());
        dto.setNotes(splice.getNotes());

        // Display names
        dto.setFromCoreName("Core #" + splice.getFromCore().getCoreNumber()
                + " (" + splice.getFromCore().getColor() + ") - " + splice.getFromCore().getCable().getCode());
        dto.setToCoreName("Core #" + splice.getToCore().getCoreNumber()
                + " (" + splice.getToCore().getColor() + ") - " + splice.getToCore().getCable().getCode());

        // Port names
        if (splice.getFromPortId() != null) {
            portRepository.findById(splice.getFromPortId()).ifPresent(port ->
                dto.setFromPortName("Port " + port.getPortNumber() + " (" + port.getDirection() + ") - Node " + port.getNodeId()));
        }
        if (splice.getToPortId() != null) {
            portRepository.findById(splice.getToPortId()).ifPresent(port ->
                dto.setToPortName("Port " + port.getPortNumber() + " (" + port.getDirection() + ") - Node " + port.getNodeId()));
        }

        return dto;
    }
}
