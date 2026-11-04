package com.saes.backend.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Une entree de l'historique des operations sensibles (V4__journal_operations.sql). */
@Entity
@Table(name = "journal_operation")
@Getter
@Setter
@NoArgsConstructor
public class JournalOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_heure", nullable = false)
    private Instant dateHeure = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acteur_id")
    private Utilisateur acteur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ActionJournal action;

    @Column(name = "objet_type", nullable = false, length = 30)
    private String objetType;

    @Column(name = "objet_id")
    private Long objetId;

    @Column(length = 500)
    private String details;
}
