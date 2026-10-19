package com.olivepress.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "apport_status_history")
public class ApportStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apport_id", nullable = false)
    private Apport apport;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private ApportStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private ApportStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt = Instant.now();

    @Column(length = 300)
    private String comment;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Apport getApport() { return apport; }
    public void setApport(Apport apport) { this.apport = apport; }
    public ApportStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(ApportStatus fromStatus) { this.fromStatus = fromStatus; }
    public ApportStatus getToStatus() { return toStatus; }
    public void setToStatus(ApportStatus toStatus) { this.toStatus = toStatus; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
