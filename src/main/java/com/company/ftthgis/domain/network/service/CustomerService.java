package com.company.ftthgis.domain.network.service;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import java.util.UUID;

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
import com.company.ftthgis.service.GeocodingService;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ODPRepository odpRepository;
    private final StatusPropagationService statusPropagationService;
    private final GeocodingService geocodingService;

    @Transactional(readOnly = true)
    public Page<CustomerDto> getCustomers(String search, String status, String name, String code, String odpCode, Pageable pageable) {
        Specification<Customer> spec = (root, query, cb) -> {
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

            if (StringUtils.hasText(odpCode)) {
                String likePattern = "%" + odpCode.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("odp").get("code")), likePattern));
            }

            if (StringUtils.hasText(name)) {
                String likePattern = "%" + name.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("name")), likePattern));
            }
            
            return predicates;
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

    public CustomerDto updateCustomer(UUID id, CustomerDto dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with ID: " + id));

        String oldStatus = customer.getStatus();
        String newStatus = dto.getStatus();
        String oldHealth = customer.getHealthStatus();
        String newHealth = dto.getHealthStatus();

        updateEntityFromDto(customer, dto);
        customer = customerRepository.save(customer);

        if (newStatus != null && !newStatus.equals(oldStatus)) {
            statusPropagationService.handleCustomerStatusChange(customer.getCode(), newStatus, dto.getLastNote());
        }

        if (newHealth != null && !newHealth.equals(oldHealth)) {
            statusPropagationService.handleCustomerHealthStatusChange(customer.getCode(), newHealth, dto.getLastNote());
        }

        return toDto(customer);
    }

    public String deleteCustomer(UUID id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found"));
        String code = customer.getCode();
        customerRepository.delete(customer);
        return code;
    }

    private CustomerDto toDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setNodeType("CUSTOMER");
        dto.setCode(customer.getCode());
        dto.setName(customer.getName());
        dto.setAddress(customer.getAddress());
        dto.setStatus(customer.getStatus());
        dto.setHealthStatus(customer.getHealthStatus());
        dto.setGeom(customer.getGeom());
        if (customer.getOdp() != null) {
            dto.setOdpId(customer.getOdp().getId());
            dto.setOdpCode(customer.getOdp().getCode());
        }
        dto.setLastNote(customer.getLastNote());
        if (customer.getGeom() != null) {
            dto.setLng(customer.getGeom().getX());
            dto.setLat(customer.getGeom().getY());
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

        if (dto.getHealthStatus() != null) {
            customer.setHealthStatus(dto.getHealthStatus());
        } else if (customer.getId() == null) {
            customer.setHealthStatus("UP");
        }

        Double lng = dto.getLng();
        Double lat = dto.getLat();
        
        if (lng == null || lat == null) {
            if (dto.getGeom() != null) {
                customer.setGeom(dto.getGeom());
            } else if (StringUtils.hasText(dto.getAddress())) {
                GeocodingService.GeocodeResult geocodeResult = geocodingService.geocode(dto.getAddress());
                if (geocodeResult != null) {
                    lng = geocodeResult.getLng();
                    lat = geocodeResult.getLat();
                }
            }
        }

        if (lng != null && lat != null) {
            GeometryFactory geometryFactory = new GeometryFactory();
            Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
            point.setSRID(4326);
            customer.setGeom(point);
        }

        if (dto.getOdpId() != null) {
            ODP odp = odpRepository.findById(dto.getOdpId())
                    .orElseThrow(() -> new EntityNotFoundException("ODP not found with ID: " + dto.getOdpId()));
            customer.setOdp(odp);
        } else {
            customer.setOdp(null);
        }

        if (StringUtils.hasText(dto.getLastNote())) {
            customer.setLastNote(dto.getLastNote());
        }
    }
}
