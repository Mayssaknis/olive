package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.StockDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.StockService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/summary")
    @RequirePermission(Permission.STOCK_READ)
    public StockDtos.StockSummaryDto summary() {
        return stockService.summary();
    }

    @GetMapping("/movements")
    @RequirePermission(Permission.STOCK_READ)
    public Page<StockDtos.StockMovementDto> movements(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        return stockService.movements(PageRequest.of(page, size));
    }

    @PostMapping("/movements")
    @RequirePermission(Permission.STOCK_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public StockDtos.StockMovementDto move(@Valid @RequestBody StockDtos.StockMovementRequest req) {
        return stockService.move(req, SecurityUtils.currentUser());
    }
}
