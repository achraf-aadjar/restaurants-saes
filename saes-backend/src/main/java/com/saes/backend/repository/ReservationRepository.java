package com.saes.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.StatutReservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByClientIdOrderByDateHeureDesc(Long clientId);

    List<Reservation> findByRestaurantIdAndStatutAndDateHeureBetween(
            Long restaurantId, StatutReservation statut, LocalDateTime debut, LocalDateTime fin);

    List<Reservation> findByClientIdAndStatutAndDateHeureAfter(
            Long clientId, StatutReservation statut, LocalDateTime date);

    /** Reservations du restaurant qui ne sont pas encore finies (a venir ou en cours). */
    @Query("select distinct r from Reservation r join r.tables t"
            + " where r.restaurant.id = :restaurantId and r.statut = :statut and t.heureFin > :maintenant"
            + " order by r.dateHeure")
    List<Reservation> nonFinies(@Param("restaurantId") Long restaurantId, @Param("statut") StatutReservation statut,
            @Param("maintenant") LocalDateTime maintenant);

    boolean existsByTablesTableId(Long tableId);
}
