package com.company.ftthgis.api.user;

import com.company.ftthgis.api.user.dto.UserDto;
import com.company.ftthgis.service.ConfigurableUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final ConfigurableUserService userService;

    @GetMapping
    public Page<UserDto> index(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return userService.findAll(search, role, status, pageable);
    }

    @PutMapping("/{id}")
    public UserDto update(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request.role(), request.status());
    }

    public record UpdateUserRequest(String role, String status) {
    }
}
