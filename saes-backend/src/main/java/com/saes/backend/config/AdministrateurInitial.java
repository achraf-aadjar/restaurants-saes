package com.saes.backend.config;

import java.util.EnumSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.UtilisateurRepository;

import lombok.RequiredArgsConstructor;

/**
 * Premier compte administrateur d'une installation neuve (en production, les
 * comptes de test du profil dev n'existent pas) : cree au demarrage a partir de
 * SAES_ADMIN_EMAIL et SAES_ADMIN_MOT_DE_PASSE, seulement si aucun
 * administrateur n'existe encore. Ensuite, l'administrateur gere les comptes
 * depuis la plateforme (cahier des charges §4.7) et ces variables peuvent
 * etre retirees.
 */
@Component
@RequiredArgsConstructor
class AdministrateurInitial implements ApplicationRunner {

    static final int LONGUEUR_MINIMALE = 12;

    private static final Logger LOG = LoggerFactory.getLogger(AdministrateurInitial.class);

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${saes.admin-initial.email:}")
    private String email;

    @Value("${saes.admin-initial.mot-de-passe:}")
    private String motDePasse;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || utilisateurRepository.existsByRolesContaining(Role.ADMINISTRATEUR)) {
            return;
        }
        if (motDePasse.length() < LONGUEUR_MINIMALE) {
            throw new IllegalStateException(
                    "SAES_ADMIN_MOT_DE_PASSE doit contenir au moins " + LONGUEUR_MINIMALE + " caracteres");
        }
        if (utilisateurRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("SAES_ADMIN_EMAIL est deja utilise par un compte qui n'est pas administrateur");
        }

        Utilisateur admin = new Utilisateur();
        admin.setNom("Administrateur");
        admin.setPrenom("Principal");
        admin.setEmail(email);
        admin.setMotDePasse(passwordEncoder.encode(motDePasse));
        admin.setRoles(EnumSet.of(Role.ADMINISTRATEUR));
        admin.setEstActif(true);
        utilisateurRepository.save(admin);
        LOG.info("Compte administrateur initial cree");
    }
}
