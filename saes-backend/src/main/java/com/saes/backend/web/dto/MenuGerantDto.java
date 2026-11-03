package com.saes.backend.web.dto;

import java.time.LocalDate;
import java.util.List;

import com.saes.backend.domain.Menu;

public record MenuGerantDto(Long id, String nom, LocalDate dateDebut, LocalDate dateFin, List<PlatDto> plats) {

    public static MenuGerantDto from(Menu m) {
        return new MenuGerantDto(
                m.getId(),
                m.getNom(),
                m.getDateDebut(),
                m.getDateFin(),
                m.getPlats().stream().map(PlatDto::from).toList());
    }
}
