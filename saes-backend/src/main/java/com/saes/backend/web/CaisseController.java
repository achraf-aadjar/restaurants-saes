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
import com.saes.backend.service.CaisseService;
import com.saes.backend.web.dto.ClotureCaisseRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.dto.EncaisserRequest;
import com.saes.backend.web.dto.OuvrirCaisseRequest;
import com.saes.backend.web.dto.SessionCaisseDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Ouvrir la caisse, Encaisser une commande, Cloturer la caisse (cahier des charges §4.5), cote caissier. */
@RestController
@RequestMapping("/api/caissier")
@RequiredArgsConstructor
public class CaisseController {

    private final CaisseService caisseService;

    @GetMapping("/caisse")
    public SessionCaisseDto maSession(@AuthenticationPrincipal UserPrincipal principal) {
        return caisseService.maSessionOuverte(principal.getId());
    }

    @PostMapping("/caisse/ouvrir")
    public ResponseEntity<SessionCaisseDto> ouvrir(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody OuvrirCaisseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(caisseService.ouvrir(principal.getId(), request));
    }

    @PutMapping("/caisse/cloturer")
    public SessionCaisseDto cloturer(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ClotureCaisseRequest request) {
        return caisseService.cloturer(principal.getId(), request);
    }

    @GetMapping("/commandes")
    public List<CommandeDto> commandesPretes(@AuthenticationPrincipal UserPrincipal principal) {
        return caisseService.commandesPretes(principal.getId());
    }

    @PutMapping("/commandes/{id}/encaisser")
    public CommandeDto encaisser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody EncaisserRequest request) {
        return caisseService.encaisser(principal.getId(), id, request);
    }
}
