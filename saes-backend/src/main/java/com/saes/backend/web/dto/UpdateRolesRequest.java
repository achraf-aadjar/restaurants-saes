package com.saes.backend.web.dto;

import java.util.Set;

import com.saes.backend.domain.Role;

import jakarta.validation.constraints.NotNull;

/**
 * Attribuer ou retirer des roles. restaurantId n'est utilise que si le compte
 * devient membre du personnel alors qu'il n'a pas encore de restaurant
 * (contrainte 2 de la conception).
 */
public record UpdateRolesRequest(@NotNull Set<Role> roles, Long restaurantId) {
}
