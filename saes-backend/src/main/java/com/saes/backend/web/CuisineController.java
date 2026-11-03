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
import com.saes.backend.service.CuisineService;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Gerer la preparation des commandes (cahier des charges §4.3), cote
 * cuisinier.
 */
@RestController
@RequestMapping("/api/cuisine/commandes")
@RequiredArgsConstructor
public class CuisineController {

    private final CuisineService cuisineService;

    @GetMapping
    public List<CommandeDto> commandesAPreparer(@AuthenticationPrincipal UserPrincipal principal) {
        return cuisineService.commandesAPreparer(principal.getId());
    }

    @PutMapping("/{id}/demarrer")
    public CommandeDto demarrer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ActionAvecVersionRequest request) {
        return cuisineService.demarrerPreparation(principal.getId(), id, request);
    }

    @PutMapping("/{id}/terminer")
    public CommandeDto terminer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ActionAvecVersionRequest request) {
        return cuisineService.terminerPreparation(principal.getId(), id, request);
    }
}
