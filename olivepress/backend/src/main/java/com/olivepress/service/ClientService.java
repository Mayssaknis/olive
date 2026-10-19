package com.olivepress.service;

import com.olivepress.domain.Client;
import com.olivepress.domain.User;
import com.olivepress.dto.ClientDtos;
import com.olivepress.dto.Mappers;
import com.olivepress.exception.NotFoundException;
import com.olivepress.repository.ClientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final Mappers mappers;
    private final AuditService auditService;
    private final NumberSequenceService sequenceService;

    public ClientService(ClientRepository clientRepository, Mappers mappers, AuditService auditService,
                         NumberSequenceService sequenceService) {
        this.clientRepository = clientRepository;
        this.mappers = mappers;
        this.auditService = auditService;
        this.sequenceService = sequenceService;
    }

    public List<ClientDtos.ClientDto> search(String query, Boolean active) {
        return clientRepository.search(query, active).stream().map(mappers::toClientDto).toList();
    }

    public Page<ClientDtos.ClientDto> searchPage(String query, Boolean active, Pageable pageable) {
        return clientRepository.searchPage(query, active, pageable).map(mappers::toClientDto);
    }

    public ClientDtos.ClientDto get(Long id) {
        return mappers.toClientDto(require(id));
    }

    public Client require(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Client introuvable: " + id));
    }

    @Transactional
    public ClientDtos.ClientDto create(ClientDtos.ClientRequest req, User actor) {
        Client c = new Client();
        apply(c, req);
        c.setActive(req.active() == null || req.active());
        c.setCode(sequenceService.nextClientCode());
        Client saved = clientRepository.save(c);
        auditService.log(actor, "CREATE", "CLIENT", saved.getId(), "Nouveau client " + saved.getFullName());
        return mappers.toClientDto(saved);
    }

    @Transactional
    public ClientDtos.ClientDto update(Long id, ClientDtos.ClientRequest req, User actor) {
        Client c = require(id);
        apply(c, req);
        if (req.active() != null) c.setActive(req.active());
        Client saved = clientRepository.save(c);
        auditService.log(actor, "UPDATE", "CLIENT", saved.getId(), "Maj client " + saved.getFullName());
        return mappers.toClientDto(saved);
    }

    private void apply(Client c, ClientDtos.ClientRequest req) {
        c.setFirstName(req.firstName().trim());
        c.setLastName(req.lastName().trim());
        c.setPhone(req.phone().trim());
        c.setAddress(req.address());
    }
}
