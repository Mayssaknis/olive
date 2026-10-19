package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.AuthDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employes")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @RequirePermission(Permission.EMPLOYEE_READ)
    public List<AuthDtos.UserDto> list() {
        return employeeService.list();
    }

    @PostMapping
    @RequirePermission(Permission.EMPLOYEE_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.UserDto create(@Valid @RequestBody AuthDtos.UserCreateRequest req) {
        return employeeService.create(req, SecurityUtils.currentUser());
    }

    @PutMapping("/{id}")
    @RequirePermission(Permission.EMPLOYEE_WRITE)
    public AuthDtos.UserDto update(@PathVariable Long id, @RequestBody AuthDtos.UserUpdateRequest req) {
        return employeeService.update(id, req, SecurityUtils.currentUser());
    }

    @PatchMapping("/{id}/toggle")
    @RequirePermission(Permission.EMPLOYEE_WRITE)
    public AuthDtos.UserDto toggle(@PathVariable Long id) {
        return employeeService.toggleActive(id, SecurityUtils.currentUser());
    }
}
