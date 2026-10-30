package com.saes.backend.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.service.AuthService;
import com.saes.backend.web.dto.AuthResponse;
import com.saes.backend.web.dto.InscriptionRequest;
import com.saes.backend.web.dto.LoginRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * S'inscrire et S'authentifier (cahier des charges §4.1). Accessible sans
 * etre connecte.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> inscrire(@Valid @RequestBody InscriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.inscrire(request));
    }

    @PostMapping("/login")
    public AuthResponse authentifier(@Valid @RequestBody LoginRequest request) {
        return authService.authentifier(request);
    }
}
