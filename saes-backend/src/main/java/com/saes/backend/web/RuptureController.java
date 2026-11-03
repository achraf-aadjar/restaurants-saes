package com.saes.backend.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.RuptureService;
import com.saes.backend.web.dto.IngredientDto;

import lombok.RequiredArgsConstructor;

/** Signaler une rupture (cahier des charges §4.6), cote cuisinier. */
@RestController
@RequestMapping("/api/cuisine/ingredients")
@RequiredArgsConstructor
public class RuptureController {

    private final RuptureService ruptureService;

    @GetMapping
    public List<IngredientDto> lister(@AuthenticationPrincipal UserPrincipal principal) {
        return ruptureService.listerIngredients(principal.getId());
    }

    @PostMapping("/{id}/signaler-rupture")
    public ResponseEntity<Void> signaler(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        ruptureService.signaler(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
