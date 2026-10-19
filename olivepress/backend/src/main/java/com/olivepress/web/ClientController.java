package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.ClientDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    @RequirePermission(Permission.CLIENT_READ)
    public List<ClientDtos.ClientDto> list(@RequestParam(required = false) String query,
                                           @RequestParam(required = false) Boolean active) {
        return clientService.search(query, active);
    }

    @GetMapping("/page")
    @RequirePermission(Permission.CLIENT_READ)
    public Page<ClientDtos.ClientDto> page(@RequestParam(required = false) String query,
                                           @RequestParam(required = false) Boolean active,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return clientService.searchPage(query, active, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    @RequirePermission(Permission.CLIENT_READ)
    public ClientDtos.ClientDto get(@PathVariable Long id) {
        return clientService.get(id);
    }

    @PostMapping
    @RequirePermission(Permission.CLIENT_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public ClientDtos.ClientDto create(@Valid @RequestBody ClientDtos.ClientRequest req) {
        return clientService.create(req, SecurityUtils.currentUser());
    }

    @PutMapping("/{id}")
    @RequirePermission(Permission.CLIENT_WRITE)
    public ClientDtos.ClientDto update(@PathVariable Long id, @Valid @RequestBody ClientDtos.ClientRequest req) {
        return clientService.update(id, req, SecurityUtils.currentUser());
    }
}
