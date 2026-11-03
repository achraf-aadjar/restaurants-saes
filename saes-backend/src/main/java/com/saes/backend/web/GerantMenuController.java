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
import com.saes.backend.service.GerantMenuService;
import com.saes.backend.web.dto.MenuGerantDto;
import com.saes.backend.web.dto.MenuSaveRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Gerer les menus (cahier des charges §4.2), cote gerant. */
@RestController
@RequestMapping("/api/gerant/menus")
@RequiredArgsConstructor
public class GerantMenuController {

    private final GerantMenuService gerantMenuService;

    @GetMapping
    public List<MenuGerantDto> lister(@AuthenticationPrincipal UserPrincipal principal) {
        return gerantMenuService.lister(principal.getId());
    }

    @PostMapping
    public ResponseEntity<MenuGerantDto> creer(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody MenuSaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gerantMenuService.creer(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public MenuGerantDto modifier(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody MenuSaveRequest request) {
        return gerantMenuService.modifier(principal.getId(), id, request);
    }
}
