package com.olivepress;

import com.olivepress.domain.Client;
import com.olivepress.domain.Facture;
import com.olivepress.domain.User;
import com.olivepress.dto.ApportDtos;
import com.olivepress.repository.ClientRepository;
import com.olivepress.repository.FactureRepository;
import com.olivepress.repository.UserRepository;
import com.olivepress.service.ApportService;
import com.olivepress.service.SettingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ApportAutoFactureTest {

    @Autowired ApportService apportService;
    @Autowired SettingService settingService;
    @Autowired ClientRepository clientRepository;
    @Autowired UserRepository userRepository;
    @Autowired FactureRepository factureRepository;

    private User admin() {
        return userRepository.findByUsername("admin").orElseThrow();
    }

    private Client client(String code) {
        Client c = new Client();
        c.setCode(code);
        c.setFirstName("Test");
        c.setLastName("Client");
        c.setPhone("20000000");
        c.setActive(true);
        return clientRepository.save(c);
    }

    @Test
    @Transactional
    void creer_un_apport_genere_une_facture_auto_au_tarif_courant() {
        User admin = admin();
        settingService.setTarifPressage(new BigDecimal("0.50"), admin);
        Client c = client("TST-001");

        ApportDtos.ApportDto dto = apportService.create(
                new ApportDtos.ApportRequest(c.getId(), null,
                        new BigDecimal("500.000"), BigDecimal.ZERO, null, null),
                admin);

        assertThat(dto.netWeightKg()).isEqualByComparingTo("500.000");

        Facture facture = factureRepository.findByApportId(dto.id()).orElseThrow();
        assertThat(facture.getTotalAmount()).isEqualByComparingTo("250.00");
        assertThat(facture.getStatut()).isEqualTo(Facture.Statut.IMPAYEE);
        assertThat(facture.getLines()).hasSize(1);
        assertThat(facture.getLines().get(0).getQuantity()).isEqualByComparingTo("500.000");
        assertThat(facture.getLines().get(0).getUnitPrice()).isEqualByComparingTo("0.50");
    }

    @Test
    @Transactional
    void le_tarif_modifie_est_applique_aux_nouveaux_apports() {
        User admin = admin();
        settingService.setTarifPressage(new BigDecimal("0.60"), admin);
        Client c = client("TST-002");

        ApportDtos.ApportDto dto = apportService.create(
                new ApportDtos.ApportRequest(c.getId(), null,
                        new BigDecimal("100.000"), BigDecimal.ZERO, null, null),
                admin);

        Facture facture = factureRepository.findByApportId(dto.id()).orElseThrow();
        assertThat(facture.getTotalAmount()).isEqualByComparingTo("60.00");
    }
}
