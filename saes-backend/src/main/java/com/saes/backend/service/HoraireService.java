package com.saes.backend.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.saes.backend.domain.HoraireOuverture;
import com.saes.backend.domain.JourSemaine;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.HoraireOuvertureRepository;

import lombok.RequiredArgsConstructor;

/**
 * Horaires d'ouverture d'un restaurant (cahier des charges §4.7, regle 14) :
 * utilise par « Passer une commande » (le restaurant doit etre ouvert a
 * l'instant de la commande), « Faire une reservation » (le creneau doit
 * etre entierement dans les horaires) et « Consulter les menus » (horaires
 * du jour, ouvert ou ferme).
 */
@Component
@RequiredArgsConstructor
class HoraireService {

    private static final Map<DayOfWeek, JourSemaine> JOURS = Map.of(
            DayOfWeek.MONDAY, JourSemaine.LUNDI,
            DayOfWeek.TUESDAY, JourSemaine.MARDI,
            DayOfWeek.WEDNESDAY, JourSemaine.MERCREDI,
            DayOfWeek.THURSDAY, JourSemaine.JEUDI,
            DayOfWeek.FRIDAY, JourSemaine.VENDREDI,
            DayOfWeek.SATURDAY, JourSemaine.SAMEDI,
            DayOfWeek.SUNDAY, JourSemaine.DIMANCHE);

    private final HoraireOuvertureRepository horaireOuvertureRepository;

    /** Vrai si l'instant donne tombe dans une plage d'ouverture du restaurant. */
    boolean estOuvertA(Restaurant restaurant, LocalDateTime instant) {
        LocalTime heure = instant.toLocalTime();
        return plagesDuJour(restaurant, instant.toLocalDate()).stream()
                .anyMatch(h -> !heure.isBefore(h.getHeureOuverture()) && heure.isBefore(h.getHeureFermeture()));
    }

    /** Plages d'ouverture d'un jour, de la plus tot a la plus tardive. */
    List<HoraireOuverture> plagesDuJour(Restaurant restaurant, LocalDate date) {
        JourSemaine jour = JOURS.get(date.getDayOfWeek());
        return horaireOuvertureRepository.findByRestaurantId(restaurant.getId()).stream()
                .filter(h -> h.getJour() == jour)
                .sorted(Comparator.comparing(HoraireOuverture::getHeureOuverture))
                .toList();
    }

    /**
     * Vrai si le creneau [debut, fin) est entierement dans les horaires du
     * jour (regle 14 : une plage commence et finit le meme jour, donc un
     * creneau qui chevauche minuit n'est jamais dans les horaires). Des plages
     * collees (12:00 - 14:00 puis 14:00 - 16:00) forment une seule periode
     * d'ouverture : un creneau peut passer de l'une a l'autre.
     */
    boolean creneauDansHoraires(Restaurant restaurant, LocalDateTime debut, LocalDateTime fin) {
        if (!debut.toLocalDate().equals(fin.toLocalDate())) {
            return false;
        }
        LocalTime heureDebut = debut.toLocalTime();
        LocalTime heureFin = fin.toLocalTime();

        LocalTime ouverture = null;
        LocalTime fermeture = null;
        for (HoraireOuverture plage : plagesDuJour(restaurant, debut.toLocalDate())) {
            if (fermeture != null && !plage.getHeureOuverture().isAfter(fermeture)) {
                // Plage collee a la precedente : la periode d'ouverture continue.
                if (plage.getHeureFermeture().isAfter(fermeture)) {
                    fermeture = plage.getHeureFermeture();
                }
                continue;
            }
            if (contient(ouverture, fermeture, heureDebut, heureFin)) {
                return true;
            }
            ouverture = plage.getHeureOuverture();
            fermeture = plage.getHeureFermeture();
        }
        return contient(ouverture, fermeture, heureDebut, heureFin);
    }

    private static boolean contient(LocalTime ouverture, LocalTime fermeture, LocalTime debut, LocalTime fin) {
        return ouverture != null && !debut.isBefore(ouverture) && !fin.isAfter(fermeture);
    }
}
