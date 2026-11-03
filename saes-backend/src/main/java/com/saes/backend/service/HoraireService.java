package com.saes.backend.service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
 * l'instant de la commande) et « Faire une reservation » (le creneau doit
 * etre entierement dans les horaires).
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
        JourSemaine jour = JOURS.get(instant.getDayOfWeek());
        LocalTime heure = instant.toLocalTime();
        return horaireOuvertureRepository.findByRestaurantId(restaurant.getId()).stream()
                .filter(h -> h.getJour() == jour)
                .anyMatch(h -> !heure.isBefore(h.getHeureOuverture()) && heure.isBefore(h.getHeureFermeture()));
    }

    /**
     * Vrai si le creneau [debut, fin) est entierement contenu dans une seule
     * plage d'ouverture du meme jour (regle 14 : une plage commence et finit
     * le meme jour, donc un creneau qui chevauche minuit n'est jamais dans
     * les horaires).
     */
    boolean creneauDansHoraires(Restaurant restaurant, LocalDateTime debut, LocalDateTime fin) {
        if (!debut.toLocalDate().equals(fin.toLocalDate())) {
            return false;
        }
        JourSemaine jour = JOURS.get(debut.getDayOfWeek());
        LocalTime heureDebut = debut.toLocalTime();
        LocalTime heureFin = fin.toLocalTime();
        List<HoraireOuverture> horaires = horaireOuvertureRepository.findByRestaurantId(restaurant.getId());
        return horaires.stream()
                .filter(h -> h.getJour() == jour)
                .anyMatch(h -> !heureDebut.isBefore(h.getHeureOuverture()) && !heureFin.isAfter(h.getHeureFermeture()));
    }
}
