package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.CustomerDto;
import com.company.ftthgis.domain.network.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/network/customers")
@RequiredArgsConstructor
public class CustomerManagementController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<Page<CustomerDto>> getAll(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(customerService.getCustomers(search, pageable));
    }

    @GetMapping("/{code}")
    public ResponseEntity<CustomerDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(customerService.getCustomerByCode(code));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> create(@RequestBody CustomerDto dto) {
        return ResponseEntity.ok(customerService.createCustomer(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDto> update(@PathVariable Long id, @RequestBody CustomerDto dto) {
        return ResponseEntity.ok(customerService.updateCustomer(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
