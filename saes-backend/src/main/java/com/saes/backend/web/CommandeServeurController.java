package com.saes.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.CommandeServeurService;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.dto.ModifierCommandeRequest;
import com.saes.backend.web.dto.OccupationRestaurantDto;
import com.saes.backend.web.dto.PrendreCommandeRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Prendre une commande, Modifier ou annuler une commande, Visualiser
 * l'occupation des tables (cahier des charges §4.3), cote serveur.
 */
@RestController
@RequestMapping("/api/serveur")
@RequiredArgsConstructor
public class CommandeServeurController {

    private final CommandeServeurService commandeServeurService;

    @GetMapping("/commandes")
    public List<CommandeDto> commandesEnAttente(@AuthenticationPrincipal UserPrincipal principal) {
        return commandeServeurService.commandesEnAttente(principal.getId());
    }

    @PostMapping("/commandes")
    public ResponseEntity<CommandeDto> prendreCommande(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PrendreCommandeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commandeServeurService.prendreCommande(principal.getId(), request));
    }

    @PutMapping("/commandes/{id}")
    public CommandeDto modifierCommande(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ModifierCommandeRequest request) {
        return commandeServeurService.modifierCommande(principal.getId(), id, request);
    }

    @PutMapping("/commandes/{id}/annuler")
    public CommandeDto annulerCommande(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ActionAvecVersionRequest request) {
        return commandeServeurService.annulerCommande(principal.getId(), id, request);
    }

    @GetMapping("/occupation-tables")
    public OccupationRestaurantDto occupationTables(@AuthenticationPrincipal UserPrincipal principal) {
        return commandeServeurService.occupationTables(principal.getId());
    }
}
