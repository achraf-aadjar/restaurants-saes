package com.saes.backend.web;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.GerantStatistiquesService;
import com.saes.backend.web.dto.StatistiquesVentesDto;

import lombok.RequiredArgsConstructor;

/** Consulter les statistiques de ventes (cahier des charges §4.6), cote gerant. */
@RestController
@RequestMapping("/api/gerant/statistiques-ventes")
@RequiredArgsConstructor
public class GerantStatistiquesController {

    private final GerantStatistiquesService gerantStatistiquesService;

    @GetMapping
    public StatistiquesVentesDto consulter(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return gerantStatistiquesService.consulter(principal.getId(), debut, fin);
    }
}
