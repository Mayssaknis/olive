package com.olivepress.web;

import com.olivepress.domain.ApportStatus;
import com.olivepress.domain.Permission;
import com.olivepress.dto.ApportDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.ApportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/apports")
public class ApportController {

    private final ApportService apportService;

    public ApportController(ApportService apportService) {
        this.apportService = apportService;
    }

    @GetMapping
    @RequirePermission(Permission.APPORT_READ)
    public Page<ApportDtos.ApportDto> list(@RequestParam(required = false) String query,
                                           @RequestParam(required = false) Long clientId,
                                           @RequestParam(required = false) ApportStatus status,
                                           @RequestParam(required = false) Instant from,
                                           @RequestParam(required = false) Instant to,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return apportService.search(query, clientId, status, from, to,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedAt")));
    }

    @GetMapping("/recent")
    @RequirePermission(Permission.APPORT_READ)
    public List<ApportDtos.ApportDto> recent() {
        return apportService.recent();
    }

    @GetMapping("/by-client/{clientId}")
    @RequirePermission(Permission.APPORT_READ)
    public List<ApportDtos.ApportDto> byClient(@PathVariable Long clientId) {
        return apportService.byClient(clientId);
    }

    @GetMapping("/{id}")
    @RequirePermission(Permission.APPORT_READ)
    public ApportDtos.ApportDto get(@PathVariable Long id) {
        return apportService.getDto(id);
    }

    @GetMapping("/{id}/ticket")
    @RequirePermission(Permission.APPORT_READ)
    public ApportDtos.TicketDto ticket(@PathVariable Long id) {
        return apportService.ticket(id);
    }

    @PostMapping
    @RequirePermission(Permission.APPORT_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApportDtos.ApportDto create(@Valid @RequestBody ApportDtos.ApportRequest req) {
        return apportService.create(req, SecurityUtils.currentUser());
    }

    @PutMapping("/{id}")
    @RequirePermission(Permission.APPORT_WRITE)
    public ApportDtos.ApportDto update(@PathVariable Long id, @Valid @RequestBody ApportDtos.ApportRequest req) {
        return apportService.update(id, req, SecurityUtils.currentUser());
    }

    @PatchMapping("/{id}/status")
    @RequirePermission(Permission.PRODUCTION_WRITE)
    public ApportDtos.ApportDto updateStatus(@PathVariable Long id,
                                             @Valid @RequestBody ApportDtos.ApportStatusUpdateRequest req) {
        return apportService.updateStatus(id, req.status(), req.comment(), SecurityUtils.currentUser());
    }

    @GetMapping("/{id}/history")
    @RequirePermission(Permission.APPORT_READ)
    public List<ApportDtos.StatusHistoryDto> history(@PathVariable Long id) {
        return apportService.history(id);
    }
}
