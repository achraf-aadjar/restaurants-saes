package com.saes.backend.web.dto;

import java.util.Set;

import com.saes.backend.domain.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7) : creer un compte
 * pour un membre du personnel, en indiquant son restaurant et ses roles.
 */
public record CreateStaffRequest(
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "doit contenir au moins 8 caractères") String motDePasse,
        String telephone,
        @NotNull Long restaurantId,
        @NotEmpty Set<Role> roles) {
}
