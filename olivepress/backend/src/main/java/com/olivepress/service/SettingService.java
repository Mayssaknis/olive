package com.olivepress.service;

import com.olivepress.domain.Setting;
import com.olivepress.domain.User;
import com.olivepress.exception.BusinessException;
import com.olivepress.repository.SettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class SettingService {

    public static final BigDecimal DEFAULT_TARIF_PRESSION_KG = new BigDecimal("0.50");

    private final SettingRepository settingRepository;
    private final AuditService auditService;

    public SettingService(SettingRepository settingRepository, AuditService auditService) {
        this.settingRepository = settingRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTarifPressage() {
        return settingRepository.findById(Setting.TARIF_PRESSION_KG)
                .map(s -> new BigDecimal(s.getValue()))
                .orElse(DEFAULT_TARIF_PRESSION_KG);
    }

    @Transactional
    public BigDecimal setTarifPressage(BigDecimal tarif, User actor) {
        if (tarif == null || tarif.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Le tarif doit etre superieur a zero");
        }
        Setting s = settingRepository.findById(Setting.TARIF_PRESSION_KG).orElseGet(() -> {
            Setting n = new Setting();
            n.setKey(Setting.TARIF_PRESSION_KG);
            return n;
        });
        s.setValue(tarif.stripTrailingZeros().toPlainString());
        settingRepository.save(s);
        auditService.log(actor, "UPDATE", "SETTING", null,
                "Tarif de pressage mis a jour: " + tarif + " DT/kg");
        return tarif;
    }
}
