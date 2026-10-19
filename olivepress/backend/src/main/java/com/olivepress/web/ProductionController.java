package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.ProductionDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.ProductionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/production")
public class ProductionController {

    private final ProductionService productionService;

    public ProductionController(ProductionService productionService) {
        this.productionService = productionService;
    }

    @GetMapping("/by-apport/{apportId}")
    @RequirePermission(Permission.PRODUCTION_READ)
    public List<ProductionDtos.ProductionDto> byApport(@PathVariable Long apportId) {
        return productionService.byApport(apportId);
    }

    @PostMapping
    @RequirePermission(Permission.PRODUCTION_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProductionDtos.ProductionDto record(@Valid @RequestBody ProductionDtos.ProductionRequest req) {
        return productionService.record(req, SecurityUtils.currentUser());
    }
}
