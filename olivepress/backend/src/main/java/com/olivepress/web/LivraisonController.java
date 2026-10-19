package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.dto.LivraisonDtos;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.LivraisonService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/livraisons")
public class LivraisonController {

    private final LivraisonService livraisonService;

    public LivraisonController(LivraisonService livraisonService) {
        this.livraisonService = livraisonService;
    }

    @GetMapping
    @RequirePermission(Permission.LIVRAISON_READ)
    public Page<LivraisonDtos.LivraisonDto> list(@RequestParam(required = false) Long clientId,
                                                 @RequestParam(required = false) Instant from,
                                                 @RequestParam(required = false) Instant to,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        return livraisonService.search(clientId, from, to,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "deliveredAt")));
    }

    @GetMapping("/{id}")
    @RequirePermission(Permission.LIVRAISON_READ)
    public LivraisonDtos.LivraisonDto get(@PathVariable Long id) {
        return livraisonService.getDto(id);
    }

    @PostMapping
    @RequirePermission(Permission.LIVRAISON_WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public LivraisonDtos.LivraisonDto create(@Valid @RequestBody LivraisonDtos.LivraisonRequest req) {
        return livraisonService.create(req, SecurityUtils.currentUser());
    }
}
