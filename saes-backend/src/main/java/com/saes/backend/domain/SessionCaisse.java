package com.saes.backend.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "session_caisse")
@Getter
@Setter
@NoArgsConstructor
public class SessionCaisse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caissier_id", nullable = false)
    private Utilisateur caissier;

    @Column(name = "date_heure_ouverture", nullable = false)
    private Instant dateHeureOuverture = Instant.now();

    @Column(name = "fond_de_caisse", nullable = false)
    private Integer fondDeCaisse;

    @Column(name = "date_heure_cloture")
    private Instant dateHeureCloture;

    @Column(name = "montant_compte")
    private Integer montantCompte;
}
