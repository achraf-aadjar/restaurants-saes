package com.saes.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.ReservationTable;
import com.saes.backend.domain.id.ReservationTableId;

public interface ReservationTableRepository extends JpaRepository<ReservationTable, ReservationTableId> {

    /**
     * Numeros des tables du restaurant deja reservees (CONFIRMEE) sur un
     * creneau qui chevauche [debut, fin) (regle 8 du cahier des charges).
     */
    @Query("""
            select rt.table.id from ReservationTable rt
            where rt.table.restaurant.id = :restaurantId
              and rt.statut = com.saes.backend.domain.StatutReservation.CONFIRMEE
              and rt.heureDebut < :fin
              and rt.heureFin > :debut
            """)
    List<Long> idsTablesReserveesSurCreneau(
            @Param("restaurantId") Long restaurantId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);
}
