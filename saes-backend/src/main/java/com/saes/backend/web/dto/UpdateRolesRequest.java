package com.saes.backend.web.dto;

import java.util.Set;

import com.saes.backend.domain.Role;

import jakarta.validation.constraints.NotEmpty;

public record UpdateRolesRequest(@NotEmpty Set<Role> roles) {
}
