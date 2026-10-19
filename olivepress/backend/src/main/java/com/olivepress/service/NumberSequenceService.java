package com.olivepress.service;

import com.olivepress.repository.ApportRepository;
import com.olivepress.repository.ClientRepository;
import com.olivepress.repository.FactureRepository;
import com.olivepress.repository.LivraisonRepository;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Generation des numeros sequences (apports, livraisons, factures).
 * Synchronise en memoire ; la veracite finale repose sur l'unicite en base (contrainte unique).
 */
@Service
public class NumberSequenceService {

    private final ApportRepository apportRepository;
    private final LivraisonRepository livraisonRepository;
    private final FactureRepository factureRepository;
    private final ClientRepository clientRepository;

    private final AtomicLong apportSeq = new AtomicLong(0);
    private final AtomicLong livraisonSeq = new AtomicLong(0);
    private final AtomicLong factureSeq = new AtomicLong(0);
    private final AtomicLong ticketSeq = new AtomicLong(0);
    private final AtomicLong clientSeq = new AtomicLong(0);

    public NumberSequenceService(ApportRepository apportRepository,
                                 LivraisonRepository livraisonRepository,
                                 FactureRepository factureRepository,
                                 ClientRepository clientRepository) {
        this.apportRepository = apportRepository;
        this.livraisonRepository = livraisonRepository;
        this.factureRepository = factureRepository;
        this.clientRepository = clientRepository;
    }

    public synchronized String nextApportNumero(int year) {
        long n = Math.max(apportSeq.incrementAndGet(), apportRepository.count());
        return String.format("AP-%d-%06d", year, n + 1);
    }

    public synchronized String nextLivraisonNumero(int year) {
        long n = Math.max(livraisonSeq.incrementAndGet(), livraisonRepository.count());
        return String.format("LIV-%d-%05d", year, n + 1);
    }

    public synchronized String nextFactureNumero(int year) {
        long n = Math.max(factureSeq.incrementAndGet(), factureRepository.count());
        return String.format("FAC-%d-%05d", year, n + 1);
    }

    public synchronized String nextTicketNumber() {
        long n = Math.max(ticketSeq.incrementAndGet(), apportRepository.count());
        return String.format("T%05d", n + 1);
    }

    public synchronized String nextClientCode() {
        long n = Math.max(clientSeq.incrementAndGet(), clientRepository.count());
        return String.format("CLI-%05d", n + 1);
    }
}
