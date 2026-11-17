package com.saes.backend.web.dto;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import com.saes.backend.domain.Menu;
import com.saes.backend.domain.Plat;

/** Un menu vu par le gerant : tous ses plats, actifs ou non, dans l'ordre de leur creation. */
public record MenuGerantDto(Long id, String nom, LocalDate dateDebut, LocalDate dateFin, List<PlatDto> plats) {

    public static MenuGerantDto from(Menu m) {
        return new MenuGerantDto(
                m.getId(),
                m.getNom(),
                m.getDateDebut(),
                m.getDateFin(),
                m.getPlats().stream()
                        .sorted(Comparator.comparing(Plat::getId))
                        .map(PlatDto::from)
                        .toList());
    }
}
