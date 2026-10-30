package com.saes.backend.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.CompteService;
import com.saes.backend.web.dto.CompteUpdateRequest;
import com.saes.backend.web.dto.UtilisateurDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Gerer son compte (cahier des charges §4.1) : tout utilisateur connecte.
 */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class AccountController {

    private final CompteService compteService;

    @GetMapping
    public UtilisateurDto consulter(@AuthenticationPrincipal UserPrincipal principal) {
        return compteService.consulter(principal.getId());
    }

    @PutMapping
    public UtilisateurDto modifier(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompteUpdateRequest request) {
        return compteService.modifier(principal.getId(), request);
    }

    @DeleteMapping
    public ResponseEntity<Void> supprimer(@AuthenticationPrincipal UserPrincipal principal) {
        compteService.supprimer(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
