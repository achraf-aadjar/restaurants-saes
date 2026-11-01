package com.saes.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.StatutReservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByClientIdOrderByDateHeureDesc(Long clientId);

    List<Reservation> findByRestaurantIdAndStatutAndDateHeureBetween(
            Long restaurantId, StatutReservation statut, LocalDateTime debut, LocalDateTime fin);
}
