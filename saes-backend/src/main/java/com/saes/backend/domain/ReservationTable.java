package com.saes.backend.domain;

import java.time.Instant;

import com.saes.backend.domain.id.ReservationTableId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Classe-association Reservation <-> TableRestaurant. heureDebut/heureFin et
 * statut sont recopies depuis la reservation : c'est sur ce couple que porte
 * la contrainte d'exclusion PostgreSQL (V1__schema.sql) qui empeche deux
 * reservations confirmees de se chevaucher sur la meme table.
 */
@Entity
@Table(name = "reservation_table")
@IdClass(ReservationTableId.class)
@Getter
@Setter
@NoArgsConstructor
public class ReservationTable {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private TableRestaurant table;

    @Column(name = "heure_debut", nullable = false)
    private Instant heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private Instant heureFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutReservation statut;
}
