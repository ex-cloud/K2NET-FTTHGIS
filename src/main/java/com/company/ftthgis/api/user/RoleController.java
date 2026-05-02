package com.company.ftthgis.api.user;

import com.company.ftthgis.api.user.dto.RoleDto;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(role -> RoleDto.builder()
                        .id(role.getId())
                        .name(role.getName())
                        .displayName(role.getDisplayName())
                        .description(role.getDescription())
                        .build())
                .collect(Collectors.toList());
    }
}
