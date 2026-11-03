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
import com.saes.backend.service.CommandeClientService;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.dto.PasserCommandeRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Passer une commande, Suivre sa commande, Annuler sa commande (cahier des
 * charges §4.3), cote client.
 */
@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeClientController {

    private final CommandeClientService commandeClientService;

    @GetMapping
    public List<CommandeDto> suivreCommandes(@AuthenticationPrincipal UserPrincipal principal) {
        return commandeClientService.suivreCommandes(principal.getId());
    }

    @PostMapping
    public ResponseEntity<CommandeDto> passerCommande(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PasserCommandeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commandeClientService.passerCommande(principal.getId(), request));
    }

    @PutMapping("/{id}/annuler")
    public CommandeDto annuler(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ActionAvecVersionRequest request) {
        return commandeClientService.annulerCommande(principal.getId(), id, request);
    }
}
