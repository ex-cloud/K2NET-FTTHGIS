package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.SplitterPortDto;
import com.company.ftthgis.domain.network.entity.SplitterPort;
import com.company.ftthgis.domain.network.repository.SplitterPortRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SplitterPortService {

    private final SplitterPortRepository portRepository;

    @Transactional(readOnly = true)
    public List<SplitterPortDto> getPortsByNodeId(UUID nodeId) {
        return portRepository.findByNodeIdOrderByDirectionAscPortNumberAsc(nodeId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SplitterPortDto getPortById(UUID portId) {
        SplitterPort port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Port not found: " + portId));
        return toDto(port);
    }

    public SplitterPortDto createPort(UUID nodeId, SplitterPortDto dto) {
        if (portRepository.existsByNodeIdAndPortNumberAndDirection(nodeId, dto.getPortNumber(), dto.getDirection())) {
            throw new IllegalArgumentException(
                    "Port " + dto.getPortNumber() + " (" + dto.getDirection() + ") already exists on node " + nodeId);
        }

        SplitterPort port = new SplitterPort();
        port.setNodeId(nodeId);
        port.setNodeType(dto.getNodeType());
        port.setPortNumber(dto.getPortNumber());
        port.setDirection(dto.getDirection());
        port.setStatus(dto.getStatus() != null ? dto.getStatus() : "AVAILABLE");
        port.setLabel(dto.getLabel());

        port = portRepository.save(port);
        return toDto(port);
    }

    public SplitterPortDto updatePort(UUID portId, SplitterPortDto dto) {
        SplitterPort port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Port not found: " + portId));

        if (dto.getStatus() != null) port.setStatus(dto.getStatus());
        if (dto.getLabel() != null) port.setLabel(dto.getLabel());

        port = portRepository.save(port);
        return toDto(port);
    }

    public String deletePort(UUID portId) {
        SplitterPort port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Port not found: " + portId));
        String label = "Port " + port.getPortNumber() + " (" + port.getDirection() + ") on Node " + port.getNodeId();
        portRepository.delete(port);
        return label;
    }

    /**
     * Auto-generate ports for a node.
     * @param nodeId the network node ID
     * @param nodeType "ODP", "ODC", or "OLT"
     * @param count number of OUT ports to generate
     * @param withUplink if true, also create 1 IN port (upstream)
     */
    public List<SplitterPortDto> generatePorts(UUID nodeId, String nodeType, int count, boolean withUplink) {
        List<SplitterPort> generated = new ArrayList<>();

        // Generate upstream IN port (slot connecting to parent)
        if (withUplink) {
            if (!portRepository.existsByNodeIdAndPortNumberAndDirection(nodeId, 1, "IN")) {
                SplitterPort inPort = new SplitterPort();
                inPort.setNodeId(nodeId);
                inPort.setNodeType(nodeType);
                inPort.setPortNumber(1);
                inPort.setDirection("IN");
                inPort.setStatus("AVAILABLE");
                inPort.setLabel("Uplink Port");
                generated.add(inPort);
            }
        }

        // Generate downstream OUT ports
        int existingMax = portRepository.findByNodeIdAndDirectionOrderByPortNumberAsc(nodeId, "OUT")
                .stream()
                .mapToInt(SplitterPort::getPortNumber)
                .max()
                .orElse(0);

        for (int i = 1; i <= count; i++) {
            int portNum = existingMax + i;
            SplitterPort outPort = new SplitterPort();
            outPort.setNodeId(nodeId);
            outPort.setNodeType(nodeType);
            outPort.setPortNumber(portNum);
            outPort.setDirection("OUT");
            outPort.setStatus("AVAILABLE");
            outPort.setLabel("Port " + portNum);
            generated.add(outPort);
        }

        List<SplitterPort> saved = portRepository.saveAll(generated);
        log.info("Generated {} ports for node {} (type={})", saved.size(), nodeId, nodeType);

        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PortSummary getPortSummary(UUID nodeId) {
        int total = portRepository.countByNodeId(nodeId);
        int used = portRepository.countByNodeIdAndStatus(nodeId, "USED");
        int available = portRepository.countByNodeIdAndStatus(nodeId, "AVAILABLE");
        int reserved = portRepository.countByNodeIdAndStatus(nodeId, "RESERVED");
        int broken = portRepository.countByNodeIdAndStatus(nodeId, "BROKEN");
        return new PortSummary(total, used, available, reserved, broken);
    }

    public record PortSummary(int total, int used, int available, int reserved, int broken) {}

    private SplitterPortDto toDto(SplitterPort port) {
        SplitterPortDto dto = new SplitterPortDto();
        dto.setId(port.getId());
        dto.setNodeId(port.getNodeId());
        dto.setNodeType(port.getNodeType());
        dto.setPortNumber(port.getPortNumber());
        dto.setDirection(port.getDirection());
        dto.setStatus(port.getStatus());
        dto.setLabel(port.getLabel());

        if (port.getConnectedCore() != null) {
            dto.setConnectedCoreId(port.getConnectedCore().getId());
            dto.setConnectedCoreName("Core #" + port.getConnectedCore().getCoreNumber()
                    + " - " + port.getConnectedCore().getCable().getCode());
        }

        return dto;
    }
}
