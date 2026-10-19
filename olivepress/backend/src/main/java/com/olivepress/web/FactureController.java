package com.olivepress.web;

import com.olivepress.domain.Facture;
import com.olivepress.domain.Permission;
import com.olivepress.dto.FactureDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.FactureService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/factures")
public class FactureController {

    private final FactureService factureService;

    public FactureController(FactureService factureService) {
        this.factureService = factureService;
    }

    @GetMapping
    @RequirePermission(Permission.FACTURE_READ)
    public Page<FactureDtos.FactureDto> list(@RequestParam(required = false) Long clientId,
                                             @RequestParam(required = false) Facture.Statut statut,
                                             @RequestParam(required = false) LocalDate from,
                                             @RequestParam(required = false) LocalDate to,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return factureService.search(clientId, statut, from, to,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "invoiceDate")));
    }

    @GetMapping("/by-client/{clientId}")
    @RequirePermission(Permission.FACTURE_READ)
    public List<FactureDtos.FactureDto> byClient(@PathVariable Long clientId) {
        return factureService.byClient(clientId);
    }

    @GetMapping("/by-apport/{apportId}")
    @RequirePermission(Permission.FACTURE_READ)
    public FactureDtos.FactureDto byApport(@PathVariable Long apportId) {
        return factureService.byApport(apportId);
    }

    @GetMapping("/{id}")
    @RequirePermission(Permission.FACTURE_READ)
    public FactureDtos.FactureDto get(@PathVariable Long id) {
        return factureService.getDto(id);
    }

    @GetMapping("/{id}/paiements")
    @RequirePermission(Permission.FACTURE_READ)
    public List<FactureDtos.PaiementDto> payments(@PathVariable Long id) {
        return factureService.payments(id);
    }

    @PostMapping
    @RequirePermission(Permission.FACTURE_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public FactureDtos.FactureDto create(@Valid @RequestBody FactureDtos.FactureRequest req) {
        return factureService.create(req, SecurityUtils.currentUser());
    }

    @PostMapping("/{id}/paiements")
    @RequirePermission(Permission.FACTURE_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public FactureDtos.FactureDto pay(@PathVariable Long id,
                                     @Valid @RequestBody FactureDtos.PaiementRequest req) {
        return factureService.pay(id, req, SecurityUtils.currentUser());
    }
}
