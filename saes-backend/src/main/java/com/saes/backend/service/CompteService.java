package com.saes.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.CompteUpdateRequest;
import com.saes.backend.web.dto.UtilisateurDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer son compte (cahier des charges §4.1) : voir/modifier ses
 * informations ; pour un client, supprimer son compte.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompteService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public UtilisateurDto consulter(Long utilisateurId) {
        return UtilisateurDto.from(trouver(utilisateurId));
    }

    @Transactional
    public UtilisateurDto modifier(Long utilisateurId, CompteUpdateRequest request) {
        Utilisateur utilisateur = trouver(utilisateurId);

        if (!utilisateur.getEmail().equalsIgnoreCase(request.email())
                && utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Cette adresse e-mail est deja utilisee");
        }

        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(request.email());
        utilisateur.setTelephone(request.telephone());
        if (request.nouveauMotDePasse() != null && !request.nouveauMotDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.nouveauMotDePasse()));
        }

        return UtilisateurDto.from(utilisateurRepository.save(utilisateur));
    }

    @Transactional
    public void supprimer(Long utilisateurId) {
        Utilisateur utilisateur = trouver(utilisateurId);
        if (!utilisateur.getRoles().equals(java.util.EnumSet.of(Role.CLIENT))) {
            throw ApiException.forbidden("Seul un compte client peut etre supprime par son titulaire");
        }
        utilisateurRepository.delete(utilisateur);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }
}
