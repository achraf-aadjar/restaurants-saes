package com.saes.backend.web;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.GerantRapportService;
import com.saes.backend.web.dto.RapportFinancierDto;

import lombok.RequiredArgsConstructor;

/** Consulter les rapports financiers (cahier des charges §4.5), cote gerant. */
@RestController
@RequestMapping("/api/gerant/rapports-financiers")
@RequiredArgsConstructor
public class GerantRapportController {

    private final GerantRapportService gerantRapportService;

    @GetMapping
    public RapportFinancierDto consulter(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return gerantRapportService.consulter(principal.getId(), debut, fin);
    }
}
