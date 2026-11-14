package com.saes.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.repository.ReservationRepository;
import com.saes.backend.web.dto.ReservationGerantDto;

import lombok.RequiredArgsConstructor;

/**
 * Reservations a venir du restaurant du gerant. Le cahier limite chaque
 * restaurant a ses tables (limite 1) : le gerant doit pouvoir voir quelles
 * tables sont retenues et par qui, pour preparer la salle ou prevenir un client.
 * Une reservation en cours (commencee, pas encore finie) est encore a venir
 * pour la salle : elle est montree.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantReservationService {

    private final PersonnelRestaurantResolver personnelRestaurantResolver;
    private final ReservationRepository reservationRepository;

    public List<ReservationGerantDto> aVenir(Long gerantId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        return reservationRepository
                .nonFinies(restaurant.getId(), StatutReservation.CONFIRMEE, LocalDateTime.now())
                .stream()
                .map(ReservationGerantDto::from)
                .toList();
    }
}
