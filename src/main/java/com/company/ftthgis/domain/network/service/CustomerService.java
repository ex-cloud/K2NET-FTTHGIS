package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.CustomerDto;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
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
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ODPRepository odpRepository;

    @Transactional(readOnly = true)
    public Page<CustomerDto> getCustomers(String search, Pageable pageable) {
        Specification<Customer> spec = (root, query, cb) -> {
            if (!StringUtils.hasText(search))
                return null;
            String likePattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("code")), likePattern),
                    cb.like(cb.lower(root.get("name")), likePattern));
        };

        return customerRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerByCode(String code) {
        return customerRepository.findByCode(code)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found: " + code));
    }

    public CustomerDto createCustomer(CustomerDto dto) {
        if (customerRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Customer Code already exists");
        }

        Customer customer = new Customer();
        updateEntityFromDto(customer, dto);
        customer = customerRepository.save(customer);
        return toDto(customer);
    }

    public CustomerDto updateCustomer(Long id, CustomerDto dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with ID: " + id));

        updateEntityFromDto(customer, dto);
        customer = customerRepository.save(customer);
        return toDto(customer);
    }

    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found"));
        customerRepository.delete(customer);
    }

    private CustomerDto toDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setNodeType("CUSTOMER");
        dto.setCode(customer.getCode());
        dto.setName(customer.getName());
        dto.setAddress(customer.getAddress());
        dto.setStatus(customer.getStatus());
        dto.setGeom(customer.getGeom());

        if (customer.getOdp() != null) {
            dto.setOdpId(customer.getOdp().getId());
            dto.setOdpCode(customer.getOdp().getCode());
        }
        return dto;
    }

    private void updateEntityFromDto(Customer customer, CustomerDto dto) {
        customer.setCode(dto.getCode());
        customer.setName(dto.getName());
        customer.setAddress(dto.getAddress());

        if (dto.getStatus() != null) {
            customer.setStatus(dto.getStatus());
        } else if (customer.getId() == null) {
            customer.setStatus("ACTIVE");
        }

        customer.setGeom(dto.getGeom());

        if (dto.getOdpId() != null) {
            ODP odp = odpRepository.findById(dto.getOdpId())
                    .orElseThrow(() -> new EntityNotFoundException("ODP not found with ID: " + dto.getOdpId()));
            customer.setOdp(odp);
        } else {
            customer.setOdp(null);
        }
    }
}
