package com.saes.backend.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.HoraireOuverture;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.TableRestaurant;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.web.dto.HoraireDto;
import com.saes.backend.web.dto.RestaurantDto;
import com.saes.backend.web.dto.RestaurantSaveRequest;
import com.saes.backend.web.dto.TableDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer les restaurants (cahier des charges §4.7), reserve a
 * l'administrateur : nom, adresse, telephone, duree de reservation, tables
 * (au moins une, numeros uniques), horaires (au moins une plage dans la
 * semaine, pas de chevauchement un meme jour).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminRestaurantService {

    private final RestaurantRepository restaurantRepository;

    public List<RestaurantDto> lister() {
        return restaurantRepository.findAll().stream().map(RestaurantDto::from).toList();
    }

    public RestaurantDto consulter(Long id) {
        return RestaurantDto.from(trouver(id));
    }

    @Transactional
    public RestaurantDto creer(RestaurantSaveRequest request) {
        valider(request);
        Restaurant restaurant = new Restaurant();
        appliquer(restaurant, request);
        return RestaurantDto.from(restaurantRepository.save(restaurant));
    }

    @Transactional
    public RestaurantDto modifier(Long id, RestaurantSaveRequest request) {
        valider(request);
        Restaurant restaurant = trouver(id);
        appliquer(restaurant, request);
        return RestaurantDto.from(restaurant);
    }

    @Transactional
    public RestaurantDto changerActivation(Long id, boolean actif) {
        Restaurant restaurant = trouver(id);
        restaurant.setEstActif(actif);
        return RestaurantDto.from(restaurant);
    }

    private void valider(RestaurantSaveRequest request) {
        long numerosDistincts = request.tables().stream().map(TableDto::numero).distinct().count();
        if (numerosDistincts != request.tables().size()) {
            throw ApiException.conflict("Deux tables ne peuvent pas avoir le meme numero");
        }

        for (var jour : com.saes.backend.domain.JourSemaine.values()) {
            List<HoraireDto> plagesDuJour = request.horaires().stream()
                    .filter(h -> h.jour() == jour)
                    .sorted((a, b) -> a.heureOuverture().compareTo(b.heureOuverture()))
                    .toList();
            for (int i = 1; i < plagesDuJour.size(); i++) {
                LocalTime finPrecedente = plagesDuJour.get(i - 1).heureFermeture();
                LocalTime debutSuivante = plagesDuJour.get(i).heureOuverture();
                if (debutSuivante.isBefore(finPrecedente)) {
                    throw ApiException.conflict("Deux plages d'un meme jour se chevauchent (" + jour + ")");
                }
            }
        }
    }

    private void appliquer(Restaurant restaurant, RestaurantSaveRequest request) {
        restaurant.setNom(request.nom());
        restaurant.setAdresse(request.adresse());
        restaurant.setTelephone(request.telephone());
        restaurant.setDureeReservationMinutes(request.dureeReservationMinutes());

        restaurant.getTables().clear();
        for (TableDto t : request.tables()) {
            TableRestaurant table = new TableRestaurant();
            table.setRestaurant(restaurant);
            table.setNumero(t.numero());
            table.setCapacite(t.capacite());
            restaurant.getTables().add(table);
        }

        restaurant.getHoraires().clear();
        for (HoraireDto h : request.horaires()) {
            HoraireOuverture horaire = new HoraireOuverture();
            horaire.setRestaurant(restaurant);
            horaire.setJour(h.jour());
            horaire.setHeureOuverture(h.heureOuverture());
            horaire.setHeureFermeture(h.heureFermeture());
            restaurant.getHoraires().add(horaire);
        }
    }

    private Restaurant trouver(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
    }
}
