package com.saes.backend.web.dto;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import com.saes.backend.domain.Menu;
import com.saes.backend.domain.Plat;

/**
 * Consulter les menus (cahier des charges §4.2) : les menus en vigueur d'un
 * restaurant et leurs plats actifs seulement, dans l'ordre de leur creation
 * (les plats d'un menu sont un ensemble sans ordre).
 */
public record MenuDto(Long id, String nom, LocalDate dateDebut, LocalDate dateFin, List<PlatDto> plats) {

    public static MenuDto from(Menu m) {
        List<PlatDto> platsActifs = m.getPlats().stream()
                .filter(Plat::isEstActif)
                .sorted(Comparator.comparing(Plat::getId))
                .map(PlatDto::from)
                .toList();
        return new MenuDto(m.getId(), m.getNom(), m.getDateDebut(), m.getDateFin(), platsActifs);
    }
}
