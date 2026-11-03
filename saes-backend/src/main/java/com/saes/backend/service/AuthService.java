package com.saes.backend.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.EnumSet;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.security.JwtService;
import com.saes.backend.web.dto.AuthResponse;
import com.saes.backend.web.dto.GoogleAuthRequest;
import com.saes.backend.web.dto.InscriptionRequest;
import com.saes.backend.web.dto.LoginRequest;
import com.saes.backend.web.dto.UtilisateurDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * S'inscrire et S'authentifier (cahier des charges §4.1), ainsi que la
 * connexion avec Google (en plus de l'email/mot de passe) : le jeton
 * d'identite envoye par le navigateur est verifie aupres de Google (sa
 * signature et son destinataire), jamais fait confiance tel quel.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${saes.google.client-id}")
    private String googleClientId;

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

    /**
     * S'inscrire ou s'authentifier avec un compte Google. Le compte est cree
     * automatiquement (role client) a la premiere connexion, comme pour
     * S'inscrire ; les connexions suivantes retrouvent ce meme compte par son
     * adresse e-mail.
     */
    @Transactional
    public AuthResponse authentifierGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifierJetonGoogle(request.idToken());
        String email = payload.getEmail();
        if (email == null || !Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw ApiException.badRequest("Ce compte Google n'a pas d'adresse e-mail vérifiée");
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            Utilisateur nouveau = new Utilisateur();
            nouveau.setNom(chaine(payload.get("family_name"), "Google"));
            nouveau.setPrenom(chaine(payload.get("given_name"), email));
            nouveau.setEmail(email);
            nouveau.setMotDePasse(passwordEncoder.encode(UUID.randomUUID().toString()));
            nouveau.setRoles(EnumSet.of(Role.CLIENT));
            nouveau.setEstActif(true);
            return utilisateurRepository.save(nouveau);
        });

        if (!utilisateur.isEstActif()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Ce compte est désactivé");
        }
        return toAuthResponse(utilisateur);
    }

    private GoogleIdToken.Payload verifierJetonGoogle(String idTokenBrut) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(idTokenBrut);
            if (idToken == null) {
                throw ApiException.badRequest("Jeton Google invalide");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            throw ApiException.badRequest("Jeton Google invalide");
        }
    }

    private String chaine(Object valeur, String defaut) {
        return valeur != null ? valeur.toString() : defaut;
    }

    private AuthResponse toAuthResponse(Utilisateur utilisateur) {
        return new AuthResponse(jwtService.generate(utilisateur.getId()), UtilisateurDto.from(utilisateur));
    }
}
