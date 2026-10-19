package com.olivepress.web;

import com.olivepress.domain.Permission;
import com.olivepress.domain.Setting;
import com.olivepress.dto.SettingDtos;
import com.olivepress.repository.SettingRepository;
import com.olivepress.security.RequirePermission;
import com.olivepress.security.SecurityUtils;
import com.olivepress.service.SettingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    private final SettingService settingService;
    private final SettingRepository settingRepository;

    public SettingController(SettingService settingService, SettingRepository settingRepository) {
        this.settingService = settingService;
        this.settingRepository = settingRepository;
    }

    @GetMapping("/tarif")
    public SettingDtos.TarifDto getTarif() {
        var s = settingRepository.findById(Setting.TARIF_PRESSION_KG).orElse(null);
        return new SettingDtos.TarifDto(settingService.getTarifPressage(), s == null ? null : s.getUpdatedAt());
    }

    @PutMapping("/tarif")
    @RequirePermission(Permission.SETTING_WRITE)
    public SettingDtos.TarifDto setTarif(@Valid @RequestBody SettingDtos.TarifUpdateRequest req) {
        var tarif = settingService.setTarifPressage(req.tarifParKg(), SecurityUtils.currentUser());
        var s = settingRepository.findById(Setting.TARIF_PRESSION_KG).orElse(null);
        return new SettingDtos.TarifDto(tarif, s == null ? null : s.getUpdatedAt());
    }
}
