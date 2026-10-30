package com.saes.backend.web.dto;

import java.time.LocalDate;
import java.util.List;

import com.saes.backend.domain.Menu;

/**
 * Consulter les menus (cahier des charges §4.2) : les menus en vigueur d'un
 * restaurant et leurs plats actifs seulement.
 */
public record MenuDto(Long id, String nom, LocalDate dateDebut, LocalDate dateFin, List<PlatDto> plats) {

    public static MenuDto from(Menu m) {
        List<PlatDto> platsActifs = m.getPlats().stream()
                .filter(com.saes.backend.domain.Plat::isEstActif)
                .map(PlatDto::from)
                .toList();
        return new MenuDto(m.getId(), m.getNom(), m.getDateDebut(), m.getDateFin(), platsActifs);
    }
}
