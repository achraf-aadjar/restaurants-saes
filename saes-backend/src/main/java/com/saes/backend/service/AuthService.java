package com.saes.backend.service;

import java.util.EnumSet;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.security.JwtService;
import com.saes.backend.web.dto.AuthResponse;
import com.saes.backend.web.dto.InscriptionRequest;
import com.saes.backend.web.dto.LoginRequest;
import com.saes.backend.web.dto.UtilisateurDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * S'inscrire et S'authentifier (cahier des charges §4.1).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse inscrire(InscriptionRequest request) {
        if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Cette adresse e-mail est déjà utilisée");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(request.email());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        utilisateur.setTelephone(request.telephone());
        utilisateur.setRoles(EnumSet.of(Role.CLIENT));
        utilisateur.setEstActif(true);

        utilisateur = utilisateurRepository.save(utilisateur);
        return toAuthResponse(utilisateur);
    }

    @Transactional
    public AuthResponse authentifier(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.motDePasse()));
        } catch (DisabledException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Ce compte est désactivé");
        } catch (AuthenticationException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Adresse e-mail ou mot de passe incorrect");
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Adresse e-mail ou mot de passe incorrect"));
        return toAuthResponse(utilisateur);
    }

    private AuthResponse toAuthResponse(Utilisateur utilisateur) {
        return new AuthResponse(jwtService.generate(utilisateur.getId()), UtilisateurDto.from(utilisateur));
    }
}
