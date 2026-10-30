package com.saes.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.service.AdminUserService;
import com.saes.backend.web.dto.CreateStaffRequest;
import com.saes.backend.web.dto.UpdateRolesRequest;
import com.saes.backend.web.dto.UtilisateurDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7), reserve a
 * l'administrateur (SecurityConfig : /api/admin/** -> ROLE_ADMINISTRATEUR).
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<UtilisateurDto> lister() {
        return adminUserService.lister();
    }

    @PostMapping
    public ResponseEntity<UtilisateurDto> creerPersonnel(@Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.creerPersonnel(request));
    }

    @PutMapping("/{id}/roles")
    public UtilisateurDto modifierRoles(@PathVariable Long id, @Valid @RequestBody UpdateRolesRequest request) {
        return adminUserService.modifierRoles(id, request);
    }

    @PutMapping("/{id}/activer")
    public UtilisateurDto activer(@PathVariable Long id) {
        return adminUserService.changerActivation(id, true);
    }

    @PutMapping("/{id}/desactiver")
    public UtilisateurDto desactiver(@PathVariable Long id) {
        return adminUserService.changerActivation(id, false);
    }
}
