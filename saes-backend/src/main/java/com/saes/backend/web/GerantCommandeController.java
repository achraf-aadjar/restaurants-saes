package com.saes.backend.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.GerantCommandeService;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Declarer une commande abandonnee (cahier des charges §4.3), cote gerant.
 */
@RestController
@RequestMapping("/api/gerant/commandes")
@RequiredArgsConstructor
public class GerantCommandeController {

    private final GerantCommandeService gerantCommandeService;

    @GetMapping
    public List<CommandeDto> commandesAbandonnables(@AuthenticationPrincipal UserPrincipal principal) {
        return gerantCommandeService.commandesAbandonnables(principal.getId());
    }

    @PutMapping("/{id}/abandonner")
    public CommandeDto declarerAbandonnee(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ActionAvecVersionRequest request) {
        return gerantCommandeService.declarerAbandonnee(principal.getId(), id, request);
    }
}
