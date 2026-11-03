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
import com.saes.backend.service.GerantStockService;
import com.saes.backend.web.dto.IngredientDto;
import com.saes.backend.web.dto.IngredientSaveRequest;
import com.saes.backend.web.dto.MouvementStockRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Gerer les stocks (cahier des charges §4.6), cote gerant. */
@RestController
@RequestMapping("/api/gerant/ingredients")
@RequiredArgsConstructor
public class GerantStockController {

    private final GerantStockService gerantStockService;

    @GetMapping
    public List<IngredientDto> lister(@AuthenticationPrincipal UserPrincipal principal) {
        return gerantStockService.lister(principal.getId());
    }

    @PostMapping
    public ResponseEntity<IngredientDto> creer(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody IngredientSaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gerantStockService.creer(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public IngredientDto modifier(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody IngredientSaveRequest request) {
        return gerantStockService.modifier(principal.getId(), id, request);
    }

    @PostMapping("/{id}/mouvements")
    public IngredientDto enregistrerMouvement(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody MouvementStockRequest request) {
        return gerantStockService.enregistrerMouvement(principal.getId(), id, request);
    }
}
