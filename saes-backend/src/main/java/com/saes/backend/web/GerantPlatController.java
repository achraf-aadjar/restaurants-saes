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
import com.saes.backend.service.GerantPlatService;
import com.saes.backend.web.dto.PlatGerantDto;
import com.saes.backend.web.dto.PlatSaveRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Gerer les plats (cahier des charges §4.2), cote gerant. */
@RestController
@RequestMapping("/api/gerant/plats")
@RequiredArgsConstructor
public class GerantPlatController {

    private final GerantPlatService gerantPlatService;

    @GetMapping
    public List<PlatGerantDto> lister(@AuthenticationPrincipal UserPrincipal principal) {
        return gerantPlatService.lister(principal.getId());
    }

    @PostMapping
    public ResponseEntity<PlatGerantDto> creer(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody PlatSaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gerantPlatService.creer(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public PlatGerantDto modifier(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody PlatSaveRequest request) {
        return gerantPlatService.modifier(principal.getId(), id, request);
    }

    @PutMapping("/{id}/activer")
    public PlatGerantDto activer(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return gerantPlatService.changerActivation(principal.getId(), id, true);
    }

    @PutMapping("/{id}/desactiver")
    public PlatGerantDto desactiver(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return gerantPlatService.changerActivation(principal.getId(), id, false);
    }
}
