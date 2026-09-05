package com.company.ftthgis.api.network;

import com.company.ftthgis.config.security.SpatialSecurityEvaluator;
import com.company.ftthgis.domain.network.dto.CustomerDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/customers")
@RequiredArgsConstructor
public class CustomerManagementController {

    private final CustomerService customerService;
    private final AssetDeletionLogRepository deletionLogRepository;
    private final SpatialSecurityEvaluator spatialSecurityEvaluator;

    @GetMapping
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<Page<CustomerDto>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String odpCode,
            Pageable pageable) {
        return ResponseEntity.ok(customerService.getCustomers(search, status, name, code, odpCode, pageable));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<CustomerDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(customerService.getCustomerByCode(code));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> create(@RequestBody CustomerDto dto) {
        if (dto == null || dto.getProjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project ID wajib diisi");
        }
        if (!spatialSecurityEvaluator.hasProjectPermission(dto.getProjectId(), "network.manage")) {
            throw new AccessDeniedException("Not authorized for target project");
        }
        return ResponseEntity.ok(customerService.createCustomer(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#id, 'network.manage')")
    public ResponseEntity<CustomerDto> update(@PathVariable UUID id, @RequestBody CustomerDto dto) {
        return ResponseEntity.ok(customerService.updateCustomer(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#id, 'network.manage')")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        String deletedCode = customerService.deleteCustomer(id);

        AssetDeletionLog log = new AssetDeletionLog();
        log.setAssetCode(deletedCode);
        log.setAssetType("CUSTOMER");
        log.setReason(reason);
        deletionLogRepository.save(log);

        return ResponseEntity.noContent().build();
    }
}

