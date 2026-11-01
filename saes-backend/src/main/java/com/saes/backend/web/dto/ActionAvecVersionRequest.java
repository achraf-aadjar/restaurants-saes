package com.saes.backend.web.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Porte le numero de version que l'ecran a affiche, pour que le serveur le
 * compare avant d'agir (regle 3 du cahier des charges, « le premier
 * l'emporte » : choix_techniques_architecture.pdf §3).
 */
public record ActionAvecVersionRequest(@NotNull Long version) {
}
