package com.saes.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.ReservationTable;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.domain.TableRestaurant;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.ReservationRepository;
import com.saes.backend.repository.ReservationTableRepository;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.FaireReservationRequest;
import com.saes.backend.web.dto.ReservationDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Faire une reservation / Gerer ses reservations (cahier des charges §4.4).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationTableRepository reservationTableRepository;
    private final RestaurantRepository restaurantRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HoraireService horaireService;
    private final TableSelectionService tableSelectionService;

    public List<ReservationDto> mesReservations(Long clientId) {
        return reservationRepository.findByClientIdOrderByDateHeureDesc(clientId).stream()
                .map(ReservationDto::from)
                .toList();
    }

    @Transactional
    public ReservationDto faireReservation(Long clientId, FaireReservationRequest request) {
        Utilisateur client = utilisateurRepository.findById(clientId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
        if (!restaurant.isEstActif()) {
            throw ApiException.notFound("Restaurant introuvable");
        }

        LocalDateTime debut = request.dateHeure();
        LocalDateTime fin = debut.plusMinutes(restaurant.getDureeReservationMinutes());

        if (!horaireService.creneauDansHoraires(restaurant, debut, fin)) {
            throw ApiException.conflict("Ce creneau n'est pas entierement dans les horaires d'ouverture");
        }

        List<Long> idsTablesReservees =
                reservationTableRepository.idsTablesReserveesSurCreneau(restaurant.getId(), debut, fin);
        List<TableRestaurant> tablesLibres = restaurant.getTables().stream()
                .filter(t -> !idsTablesReservees.contains(t.getId()))
                .toList();

        List<TableRestaurant> tablesChoisies = tableSelectionService.choisir(tablesLibres, request.nombreCouverts());
        if (tablesChoisies.isEmpty()) {
            throw ApiException.conflict("Il n'y a pas assez de places disponibles sur ce creneau");
        }

        Reservation reservation = new Reservation();
        reservation.setRestaurant(restaurant);
        reservation.setClient(client);
        reservation.setDateHeure(debut);
        reservation.setDureeMinutes(restaurant.getDureeReservationMinutes());
        reservation.setNombreCouverts(request.nombreCouverts());
        reservation.setStatut(StatutReservation.CONFIRMEE);

        for (TableRestaurant table : tablesChoisies) {
            ReservationTable rt = new ReservationTable();
            rt.setReservation(reservation);
            rt.setTable(table);
            rt.setHeureDebut(debut);
            rt.setHeureFin(fin);
            rt.setStatut(StatutReservation.CONFIRMEE);
            reservation.getTables().add(rt);
        }

        try {
            reservation = reservationRepository.saveAndFlush(reservation);
        } catch (DataIntegrityViolationException e) {
            // Contrainte d'exclusion PostgreSQL : une autre reservation a pris la
            // meme table sur un creneau chevauchant entre notre lecture et notre
            // ecriture (choix_techniques_architecture.pdf §3, "le premier l'emporte").
            throw ApiException.conflict("Ce creneau vient d'etre reserve par quelqu'un d'autre, veuillez reessayer");
        }

        return ReservationDto.from(reservation);
    }

    @Transactional
    public void annulerReservation(Long clientId, Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> ApiException.notFound("Reservation introuvable"));
        if (!reservation.getClient().getId().equals(clientId)) {
            throw ApiException.forbidden("Cette reservation n'est pas la votre");
        }
        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw ApiException.conflict("Cette reservation est deja annulee");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        reservation.getTables().forEach(rt -> rt.setStatut(StatutReservation.ANNULEE));
    }
}
