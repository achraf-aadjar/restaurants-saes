package com.saes.backend.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.GerantReservationService;
import com.saes.backend.web.dto.ReservationGerantDto;

import lombok.RequiredArgsConstructor;

/** Reservations a venir du restaurant du gerant. */
@RestController
@RequestMapping("/api/gerant/reservations")
@RequiredArgsConstructor
public class GerantReservationController {

    private final GerantReservationService gerantReservationService;

    @GetMapping
    public List<ReservationGerantDto> aVenir(@AuthenticationPrincipal UserPrincipal principal) {
        return gerantReservationService.aVenir(principal.getId());
    }
}
