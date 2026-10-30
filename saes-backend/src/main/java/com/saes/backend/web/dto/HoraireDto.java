package com.saes.backend.web.dto;

import java.time.LocalTime;

import com.saes.backend.domain.HoraireOuverture;
import com.saes.backend.domain.JourSemaine;

import jakarta.validation.constraints.NotNull;

public record HoraireDto(
        Long id,
        @NotNull JourSemaine jour,
        @NotNull LocalTime heureOuverture,
        @NotNull LocalTime heureFermeture) {

    public static HoraireDto from(HoraireOuverture h) {
        return new HoraireDto(h.getId(), h.getJour(), h.getHeureOuverture(), h.getHeureFermeture());
    }
}
