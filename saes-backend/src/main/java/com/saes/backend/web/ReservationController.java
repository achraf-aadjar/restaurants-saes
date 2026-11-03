package com.saes.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.security.UserPrincipal;
import com.saes.backend.service.ReservationService;
import com.saes.backend.web.dto.FaireReservationRequest;
import com.saes.backend.web.dto.ReservationDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Faire une reservation, Gerer ses reservations (cahier des charges §4.4).
 */
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public List<ReservationDto> mesReservations(@AuthenticationPrincipal UserPrincipal principal) {
        return reservationService.mesReservations(principal.getId());
    }

    @PostMapping
    public ResponseEntity<ReservationDto> faireReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FaireReservationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.faireReservation(principal.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> annuler(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        reservationService.annulerReservation(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
