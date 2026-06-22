package com.company.ftthgis.domain.analytics.service;

import com.company.ftthgis.domain.analytics.entity.MaterialPrice;
import com.company.ftthgis.domain.analytics.repository.MaterialPriceRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BOQService {

    private final FiberCableRepository cableRepository;
    private final NetworkNodeRepository nodeRepository;
    private final MaterialPriceRepository priceRepository;

    public Map<String, Object> generateProjectBOQ(UUID projectId) {
        log.info("Generating BOQ for project: {}", projectId);

        // 1. Calculate Cable Lengths (Spatial Data)
        // Using native queries or sum in repo
        Double totalLength = cableRepository.sumLengthByProjectId(projectId);
        if (totalLength == null) totalLength = 0.0;

        // 2. Count Nodes by Type
        Map<String, Long> nodeCounts = new HashMap<>();
        // In reality, we'd query this efficiently
        nodeCounts.put("ODP", nodeRepository.countByTypeAndProjectId("ODP", projectId));
        nodeCounts.put("ODC", nodeRepository.countByTypeAndProjectId("ODC", projectId));
        nodeCounts.put("OLT", nodeRepository.countByTypeAndProjectId("OLT", projectId));

        // 3. Match with Prices
        List<Map<String, Object>> lineItems = new ArrayList<>();
        double grandTotal = 0.0;

        // Cable Item
        MaterialPrice cablePrice = priceRepository.findByMaterialName("Fiber Cable Standard")
                .orElse(MaterialPrice.builder().price(15000.0).unit("METER").build()); // Fallback
        
        double cableTotal = totalLength * cablePrice.getPrice();
        lineItems.add(createItem("Fiber Optic Cable", totalLength, cablePrice.getUnit(), cablePrice.getPrice(), cableTotal));
        grandTotal += cableTotal;

        // Node Items
        for (Map.Entry<String, Long> entry : nodeCounts.entrySet()) {
            if (entry.getValue() == 0) continue;
            
            MaterialPrice price = priceRepository.findByMaterialName(entry.getKey() + " Standard")
                    .orElse(MaterialPrice.builder().price(500000.0).unit("UNIT").build());
            
            double itemTotal = entry.getValue() * price.getPrice();
            lineItems.add(createItem(entry.getKey() + " Device", entry.getValue().doubleValue(), price.getUnit(), price.getPrice(), itemTotal));
            grandTotal += itemTotal;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("projectId", projectId);
        result.put("generatedAt", new Date());
        result.put("items", lineItems);
        result.put("grandTotal", grandTotal);
        result.put("currency", "IDR");

        return result;
    }

    private Map<String, Object> createItem(String name, Double qty, String unit, Double unitPrice, Double total) {
        Map<String, Object> item = new HashMap<>();
        item.put("description", name);
        item.put("quantity", qty);
        item.put("unit", unit);
        item.put("unitPrice", unitPrice);
        item.put("totalPrice", total);
        return item;
    }
}
