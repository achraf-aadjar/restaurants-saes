package com.saes.backend.web.dto;

import java.time.Instant;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.JournalOperation;

public record JournalOperationDto(
        Long id,
        Instant dateHeure,
        Long acteurId,
        String acteur,
        ActionJournal action,
        String objetType,
        Long objetId,
        String details) {

    public static JournalOperationDto from(JournalOperation j) {
        var acteur = j.getActeur();
        return new JournalOperationDto(
                j.getId(),
                j.getDateHeure(),
                acteur != null ? acteur.getId() : null,
                acteur != null ? acteur.getPrenom() + " " + acteur.getNom() : null,
                j.getAction(),
                j.getObjetType(),
                j.getObjetId(),
                j.getDetails());
    }
}
