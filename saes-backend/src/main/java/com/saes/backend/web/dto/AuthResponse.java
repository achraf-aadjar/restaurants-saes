package com.saes.backend.web.dto;

public record AuthResponse(String token, UtilisateurDto utilisateur) {
}
