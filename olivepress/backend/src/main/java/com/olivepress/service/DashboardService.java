package com.olivepress.service;

import com.olivepress.domain.*;
import com.olivepress.dto.DashboardDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class DashboardService {

    private final ApportRepository apportRepository;
    private final ProductionRecordRepository productionRepository;
    private final StockMovementRepository stockRepository;
    private final FactureRepository factureRepository;
    private final PaiementRepository paiementRepository;
    private final Mappers mappers;

    private static final List<ApportStatus> PENDING = List.of(
            ApportStatus.RECU, ApportStatus.EN_ATTENTE, ApportStatus.TRI, ApportStatus.PRESSAGE);

    public DashboardService(ApportRepository apportRepository,
                            ProductionRecordRepository productionRepository,
                            StockMovementRepository stockRepository,
                            FactureRepository factureRepository,
                            PaiementRepository paiementRepository,
                            Mappers mappers) {
        this.apportRepository = apportRepository;
        this.productionRepository = productionRepository;
        this.stockRepository = stockRepository;
        this.factureRepository = factureRepository;
        this.paiementRepository = paiementRepository;
        this.mappers = mappers;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardDtos.DashboardDto build() {
        // Bornes UTC du jour courant
        java.time.Instant now = java.time.Instant.now();
        java.time.Instant dayStart = now.atZone(ZoneOffset.UTC).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        java.time.Instant dayEnd = dayStart.plusSeconds(86400);

        long apportsToday = apportRepository.countByReceivedAtBetween(dayStart, dayEnd);
        BigDecimal netToday = nvl(apportRepository.sumNetWeightBetween(dayStart, dayEnd));

        BigDecimal totalOlives = nvl(productionRepository.sumOlivesProcessedBetween(LocalDate.of(2000, 1, 1), LocalDate.now()));
        BigDecimal totalOil = nvl(productionRepository.sumOilObtainedBetween(LocalDate.of(2000, 1, 1), LocalDate.now()));
        BigDecimal avgYield = totalOlives.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                : totalOil.multiply(new BigDecimal("100")).divide(totalOlives, 2, RoundingMode.HALF_UP);

        long pending = apportRepository.countByStatusIn(PENDING);
        BigDecimal availableStock = stockRepository.availableStock();

        BigDecimal totalInvoiced = nvl(factureRepository.sumTotal());
        BigDecimal totalCollected = nvl(paiementRepository.sumAll());
        BigDecimal totalRemaining = totalInvoiced.subtract(totalCollected);

        List<DashboardDtos.ProductionPoint> productionByDay = productionByDay();
        List<DashboardDtos.YieldPoint> yieldByDay = yieldByDay(productionByDay);

        List<DashboardDtos.ApportSummary> recentApports = apportRepository.findTop10ByOrderByReceivedAtDesc()
                .stream()
                .map(a -> new DashboardDtos.ApportSummary(a.getId(), a.getNumero(),
                        a.getClient().getFullName(), a.getNetWeightKg(), a.getReceivedAt(),
                        a.getStatus().getLabel()))
                .toList();

        List<DashboardDtos.OperationSummary> pendingList = apportRepository.findByStatusInOrderByReceivedAtAsc(PENDING)
                .stream()
                .map(a -> new DashboardDtos.OperationSummary(a.getId(), a.getNumero(),
                        a.getClient().getFullName(), a.getNetWeightKg(), a.getStatus().getLabel()))
                .toList();

        List<DashboardDtos.UnpaidInvoice> unpaid = factureRepository.findUnpaid().stream()
                .map(f -> {
                    BigDecimal paid = nvl(paiementRepository.sumByFacture(f.getId()));
                    return new DashboardDtos.UnpaidInvoice(f.getId(), f.getNumero(),
                            f.getClient().getFullName(), f.getTotalAmount(),
                            f.getTotalAmount().subtract(paid), f.getStatut().name(), f.getInvoiceDate());
                })
                .toList();

        return new DashboardDtos.DashboardDto(
                apportsToday, netToday, totalOlives, totalOil, avgYield,
                pending, availableStock, totalInvoiced, totalCollected, totalRemaining,
                productionByDay, yieldByDay, recentApports, pendingList, unpaid);
    }

    private List<DashboardDtos.ProductionPoint> productionByDay() {
        LocalDate from = LocalDate.now().minusDays(13);
        Map<LocalDate, BigDecimal[]> agg = new TreeMap<>();
        for (ProductionRecord p : productionRepository.findSince(from)) {
            agg.computeIfAbsent(p.getProductionDate(), k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal[] v = agg.get(p.getProductionDate());
            v[0] = v[0].add(p.getOlivesProcessedKg());
            v[1] = v[1].add(p.getOilObtainedL());
        }
        List<DashboardDtos.ProductionPoint> points = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(LocalDate.now()); d = d.plusDays(1)) {
            BigDecimal[] v = agg.getOrDefault(d, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            points.add(new DashboardDtos.ProductionPoint(d, v[0], v[1]));
        }
        return points;
    }

    private List<DashboardDtos.YieldPoint> yieldByDay(List<DashboardDtos.ProductionPoint> production) {
        return production.stream()
                .map(pt -> {
                    BigDecimal y = pt.olivesKg().compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                            : pt.oilL().multiply(new BigDecimal("100"))
                                    .divide(pt.olivesKg(), 2, RoundingMode.HALF_UP);
                    return new DashboardDtos.YieldPoint(pt.date(), y);
                })
                .toList();
    }

    private BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
