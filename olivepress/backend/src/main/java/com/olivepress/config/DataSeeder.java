package com.olivepress.config;

import com.olivepress.domain.*;
import com.olivepress.repository.*;
import com.olivepress.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;

/**
 * Initialisation : compte administrateur + employe de demonstration + jeu de donnees (si active).
 * Le mot de passe admin provient des variables d'environnement, jamais code en dur.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ApportRepository apportRepository;
    private final ProductionRecordRepository productionRepository;
    private final StockMovementRepository stockRepository;
    private final LivraisonRepository livraisonRepository;
    private final FactureRepository factureRepository;
    private final PaiementRepository paiementRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.olivepress.repository.SettingRepository settingRepository;

    @Value("${olivepress.admin.username:admin}") private String adminUsername;
    @Value("${olivepress.admin.email:admin@olivepress.local}") private String adminEmail;
    @Value("${olivepress.admin.password:admin1234}") private String adminPassword;
    @Value("${olivepress.admin.full-name:Administrateur OlivePress}") private String adminFullName;
    @Value("${olivepress.seed.demo:false}") private boolean seedDemo;

    public DataSeeder(UserRepository userRepository, ClientRepository clientRepository,
                      ApportRepository apportRepository, ProductionRecordRepository productionRepository,
                      StockMovementRepository stockRepository, LivraisonRepository livraisonRepository,
                      FactureRepository factureRepository, PaiementRepository paiementRepository,
                      PasswordEncoder passwordEncoder,
                      com.olivepress.repository.SettingRepository settingRepository) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.apportRepository = apportRepository;
        this.productionRepository = productionRepository;
        this.stockRepository = stockRepository;
        this.livraisonRepository = livraisonRepository;
        this.factureRepository = factureRepository;
        this.paiementRepository = paiementRepository;
        this.passwordEncoder = passwordEncoder;
        this.settingRepository = settingRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User admin = userRepository.findByUsername(adminUsername).orElseGet(() -> {
            User u = new User();
            u.setUsername(adminUsername);
            u.setEmail(adminEmail);
            u.setPasswordHash(passwordEncoder.encode(adminPassword));
            u.setFullName(adminFullName);
            u.setRole(Role.ADMIN);
            u.setActive(true);
            u.setPermissions(new java.util.HashSet<>());
            return userRepository.save(u);
        });

        if (settingRepository.findById(Setting.TARIF_PRESSION_KG).isEmpty()) {
            Setting tarif = new Setting();
            tarif.setKey(Setting.TARIF_PRESSION_KG);
            tarif.setValue("0.50");
            settingRepository.save(tarif);
        }

        if (!seedDemo || clientRepository.count() > 0) {
            log.info("[OlivePress] Compte administrateur pret: {}", admin.getUsername());
            log.debug("[OlivePress] Jeu de donnees de demonstration desactive ou deja present.");
            return;
        }

        log.info("[OlivePress] Generation du jeu de donnees de demonstration...");
        User employee = userRepository.findByUsername("employe").orElseGet(() -> {
            User u = new User();
            u.setUsername("employe");
            u.setEmail("employe@olivepress.local");
            u.setPasswordHash(passwordEncoder.encode("employe1234"));
            u.setFullName("Karim Benali");
            u.setRole(Role.EMPLOYEE);
            u.setActive(true);
            u.setPermissions(AuthService.defaultEmployeePermissions());
            return userRepository.save(u);
        });

        String[][] clientsData = {
                {"Ahmed", "El Fassi", "0661 11 22 33", "Douar El Oued"},
                {"Fatima", "Zahra", "0662 44 55 66", "Route de Meknes"},
                {"Youssef", "Amrani", "0663 77 88 99", "Souk El Had"},
                {"Khadija", "Bennani", "0664 12 34 56", "Ait Ourir"},
        };
        Client[] clients = new Client[clientsData.length];
        for (int i = 0; i < clientsData.length; i++) {
            Client c = new Client();
            c.setCode(String.format("CLI-%05d", i + 1));
            c.setFirstName(clientsData[i][0]);
            c.setLastName(clientsData[i][1]);
            c.setPhone(clientsData[i][2]);
            c.setAddress(clientsData[i][3]);
            clients[i] = clientRepository.save(c);
        }

        BigDecimal totalOil = BigDecimal.ZERO;
        int counter = 1;
        for (int day = 12; day >= 0; day -= 2) {
            for (int k = 0; k < 2; k++) {
                Client client = clients[(counter) % clients.length];
                BigDecimal gross = new BigDecimal(1200 + (day * 37) + (counter * 53));
                BigDecimal tare = new BigDecimal("25.000");

                Apport a = new Apport();
                a.setNumero(String.format("AP-%d-%06d", LocalDate.now().getYear(), counter));
                a.setClient(client);
                a.setReceivedAt(Instant.now().minus(day, ChronoUnit.DAYS));
                a.setGrossWeightKg(gross);
                a.setTareKg(tare);
                a.recalculateNetWeight();
                a.setTicketNumber("T" + (1000 + counter));
                a.setEmployee(employee);
                a.setStatus(ApportStatus.PRODUCTION_TERMINEE);
                a = apportRepository.save(a);

                BigDecimal processed = a.getNetWeightKg();
                BigDecimal oil = processed.multiply(new BigDecimal("0.18"))
                        .setScale(3, RoundingMode.HALF_UP);
                BigDecimal yield = oil.multiply(new BigDecimal("100"))
                        .divide(processed, 3, RoundingMode.HALF_UP);

                ProductionRecord p = new ProductionRecord();
                p.setApport(a);
                p.setOlivesProcessedKg(processed);
                p.setOilObtainedL(oil);
                p.setYieldPercent(yield);
                p.setProductionDate(LocalDate.now().minusDays(day));
                p.setEmployee(employee);
                productionRepository.save(p);
                totalOil = totalOil.add(oil);

                StockMovement m = new StockMovement();
                m.setMovementType(MovementType.ENTREE);
                m.setQuantityL(oil);
                m.setLotNumber("LOT-" + a.getNumero());
                m.setClient(client);
                m.setReason("Production " + a.getNumero());
                m.setUser(employee);
                m.setCreatedAt(Instant.now().minus(day, ChronoUnit.DAYS));
                stockRepository.save(m);
                counter++;
            }
        }

        // Une livraison + facture + paiement partiel pour la demonstration
        Livraison l = new Livraison();
        l.setNumero("LIV-" + LocalDate.now().getYear() + "-00001");
        l.setClient(clients[0]);
        l.setQuantityL(new BigDecimal("150.000"));
        l.setLotNumber("LOT-AP-" + LocalDate.now().getYear() + "-000001");
        l.setDeliveredAt(Instant.now().minus(3, ChronoUnit.DAYS));
        l.setEmployee(employee);
        livraisonRepository.save(l);

        StockMovement out = new StockMovement();
        out.setMovementType(MovementType.SORTIE);
        out.setQuantityL(new BigDecimal("150.000"));
        out.setClient(clients[0]);
        out.setReason("Livraison " + l.getNumero());
        out.setUser(employee);
        out.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        stockRepository.save(out);

        Facture f = new Facture();
        f.setNumero("FAC-" + LocalDate.now().getYear() + "-00001");
        f.setClient(clients[0]);
        f.setInvoiceDate(LocalDate.now().minusDays(3));
        f.setDueDate(LocalDate.now().plusDays(12));
        FactureLine line = new FactureLine();
        line.setFacture(f);
        line.setDescription("Prestation de pressage - 150 L");
        line.setQuantity(new BigDecimal("150.000"));
        line.setUnitPrice(new BigDecimal("4.50"));
        line.recalculateTotal();
        f.getLines().add(line);
        f.recalculateTotal();
        f.setStatut(Facture.Statut.IMPAYEE);
        f = factureRepository.save(f);

        Paiement pay = new Paiement();
        pay.setFacture(f);
        pay.setAmount(new BigDecimal("300.00"));
        pay.setMode(Paiement.Mode.ESPECES);
        pay.setEmployee(employee);
        pay.setPaidAt(Instant.now().minus(2, ChronoUnit.DAYS));
        paiementRepository.save(pay);
        f.setStatut(Facture.Statut.PARTIELLE);
        factureRepository.save(f);

        log.info("[OlivePress] Donnees de demonstration creees. Admin={}, employe=employe", admin.getUsername());
    }
}
