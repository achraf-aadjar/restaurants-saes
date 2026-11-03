package com.saes.backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.StatutReservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByClientIdAndStatutAndDateHeureAfter(Long clientId, StatutReservation statut, Instant date);

    boolean existsByTablesTableId(Long tableId);
}
