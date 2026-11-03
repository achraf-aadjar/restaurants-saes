package com.saes.backend.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.RecommandationService;
import com.saes.backend.web.dto.RecommandationDto;

import lombok.RequiredArgsConstructor;

/** Consulter les recommandations d'approvisionnement (cahier des charges §4.6), cote gerant. */
@RestController
@RequestMapping("/api/gerant/recommandations")
@RequiredArgsConstructor
public class RecommandationController {

    private final RecommandationService recommandationService;

    @GetMapping
    public List<RecommandationDto> lister(@AuthenticationPrincipal UserPrincipal principal) {
        return recommandationService.lister(principal.getId());
    }
}
