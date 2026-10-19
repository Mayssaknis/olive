package com.olivepress.service;

import com.olivepress.domain.ApportStatus;
import com.olivepress.dto.DashboardDtos;
import com.olivepress.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Rapports. Les valeurs sont exportables cote client (PDF/Excel) depuis l'app mobile.
 */
@Service
public class ReportService {

    private final ApportRepository apportRepository;
    private final ProductionRecordRepository productionRepository;
    private final StockMovementRepository stockRepository;
    private final LivraisonRepository livraisonRepository;
    private final FactureRepository factureRepository;
    private final PaiementRepository paiementRepository;

    public ReportService(ApportRepository apportRepository,
                         ProductionRecordRepository productionRepository,
                         StockMovementRepository stockRepository,
                         LivraisonRepository livraisonRepository,
                         FactureRepository factureRepository,
                         PaiementRepository paiementRepository) {
        this.apportRepository = apportRepository;
        this.productionRepository = productionRepository;
        this.stockRepository = stockRepository;
        this.livraisonRepository = livraisonRepository;
        this.factureRepository = factureRepository;
        this.paiementRepository = paiementRepository;
    }

    public Map<String, Object> buildReport(String type, LocalDate from, LocalDate to) {
        return switch (type == null ? "" : type.toLowerCase()) {
            case "reception" -> reception(from, to);
            case "production" -> production(from, to);
            case "stock" -> stock();
            case "facturation" -> facturation(from, to);
            default -> all(from, to);
        };
    }

    private Map<String, Object> all(LocalDate from, LocalDate to) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("periode", Map.of("from", from.toString(), "to", to.toString()));
        m.put("reception", reception(from, to));
        m.put("production", production(from, to));
        m.put("stock", stock());
        m.put("facturation", facturation(from, to));
        return m;
    }

    private Map<String, Object> reception(LocalDate from, LocalDate to) {
        var fi = atStart(from);
        var ti = atEnd(to);
        long count = apportRepository.countByReceivedAtBetween(fi, ti);
        BigDecimal net = apportRepository.sumNetWeightBetween(fi, ti);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nombreApports", count);
        m.put("poidsNetTotalKg", net == null ? BigDecimal.ZERO : net);
        m.put("parStatut", apportStatusBreakdown());
        return m;
    }

    private Map<String, Object> production(LocalDate from, LocalDate to) {
        BigDecimal olives = productionRepository.sumOlivesProcessedBetween(from, to);
        BigDecimal oil = productionRepository.sumOilObtainedBetween(from, to);
        BigDecimal yield = (olives == null || olives.compareTo(BigDecimal.ZERO) == 0) ? BigDecimal.ZERO
                : oil.multiply(new BigDecimal("100")).divide(olives, 3, RoundingMode.HALF_UP);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("olivesTraiteesKg", olives == null ? BigDecimal.ZERO : olives);
        m.put("huileProduiteL", oil == null ? BigDecimal.ZERO : oil);
        m.put("rendementMoyenPourcent", yield);
        return m;
    }

    private Map<String, Object> stock() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("stockDisponibleL", stockRepository.availableStock());
        m.put("entreesL", nvl(stockRepository.sumIn()));
        m.put("sortiesL", nvl(stockRepository.sumOut()));
        return m;
    }

    private Map<String, Object> facturation(LocalDate from, LocalDate to) {
        var fi = atStart(from);
        var ti = atEnd(to);
        BigDecimal totalFactures = nvl(factureRepository.sumTotal());
        BigDecimal totalPaye = nvl(paiementRepository.sumAll());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalFacture", totalFactures);
        m.put("totalEncaisse", totalPaye);
        m.put("resteAPayer", totalFactures.subtract(totalPaye));
        m.put("facturesImpayees", factureRepository.findUnpaid().size());
        return m;
    }

    private Map<String, Long> apportStatusBreakdown() {
        Map<String, Long> m = new LinkedHashMap<>();
        for (ApportStatus s : ApportStatus.values()) {
            m.put(s.getLabel(), 0L);
        }
        apportRepository.findAll().forEach(a ->
                m.merge(a.getStatus().getLabel(), 1L, Long::sum));
        return m;
    }

    private java.time.Instant atStart(LocalDate d) {
        return d.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private java.time.Instant atEnd(LocalDate d) {
        return d.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private BigDecimal nvl(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
