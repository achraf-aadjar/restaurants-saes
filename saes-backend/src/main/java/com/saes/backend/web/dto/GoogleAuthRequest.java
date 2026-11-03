package com.saes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;

/** S'inscrire ou s'authentifier avec un compte Google (en plus de §4.1). */
public record GoogleAuthRequest(@NotBlank String idToken) {
}
