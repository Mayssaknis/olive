package com.olivepress.dto;

import com.olivepress.domain.AppNotification;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class DashboardDtos {

    public record DashboardDto(
            long apportsToday,
            java.math.BigDecimal netWeightTodayKg,
            java.math.BigDecimal olivesProcessedTotalKg,
            java.math.BigDecimal oilProducedTotalL,
            java.math.BigDecimal avgYieldPercent,
            long pendingOperations,
            java.math.BigDecimal availableStockL,
            java.math.BigDecimal totalInvoiced,
            java.math.BigDecimal totalCollected,
            java.math.BigDecimal totalRemaining,
            List<ProductionPoint> productionByDay,
            List<YieldPoint> yieldByDay,
            List<ApportSummary> recentApports,
            List<OperationSummary> pendingList,
            List<UnpaidInvoice> unpaidInvoices) {}

    public record ProductionPoint(LocalDate date, java.math.BigDecimal olivesKg, java.math.BigDecimal oilL) {}
    public record YieldPoint(LocalDate date, java.math.BigDecimal yieldPercent) {}

    public record ApportSummary(Long id, String numero, String clientName,
                                java.math.BigDecimal netWeightKg, Instant receivedAt, String status) {}

    public record OperationSummary(Long apportId, String numero, String clientName,
                                   java.math.BigDecimal netWeightKg, String status) {}

    public record UnpaidInvoice(Long id, String numero, String clientName,
                                java.math.BigDecimal totalAmount, java.math.BigDecimal remainingAmount,
                                String statut, LocalDate invoiceDate) {}

    public record NotificationDto(
            Long id, String title, String message, AppNotification.Type type,
            boolean readFlag, String entityType, Long entityId, Instant createdAt) {}

    public record HistoryDto(
            Long id, String userName, String action, String entityType,
            Long entityId, String details, Instant createdAt) {}

    private DashboardDtos() {}
}
