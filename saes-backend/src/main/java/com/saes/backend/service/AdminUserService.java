package com.saes.backend.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.CreateStaffRequest;
import com.saes.backend.web.dto.UpdateRolesRequest;
import com.saes.backend.web.dto.UtilisateurDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7), reserve a
 * l'administrateur : creer des comptes pour le personnel, attribuer/retirer
 * des roles, desactiver/reactiver un compte.
 *
 * Contrainte 2 de la conception : un utilisateur a un restaurant si et
 * seulement s'il a un role du personnel.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private static final Set<Role> ROLES_PERSONNEL =
            EnumSet.of(Role.SERVEUR, Role.CUISINIER, Role.CAISSIER, Role.GERANT);

    private final UtilisateurRepository utilisateurRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JournalService journalService;

    public List<UtilisateurDto> lister() {
        return utilisateurRepository.findAll().stream().map(UtilisateurDto::from).toList();
    }

    @Transactional
    public UtilisateurDto creerPersonnel(CreateStaffRequest request) {
        if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Cette adresse e-mail est déjà utilisée");
        }
        if (!estPersonnel(request.roles())) {
            throw ApiException.badRequest("Le compte doit avoir au moins un rôle du personnel");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(request.email());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        utilisateur.setTelephone(request.telephone());
        utilisateur.setRestaurant(trouverRestaurant(request.restaurantId()));
        utilisateur.setRoles(EnumSet.copyOf(request.roles()));
        utilisateur.setEstActif(true);

        utilisateur = utilisateurRepository.save(utilisateur);
        journalService.enregistrer(ActionJournal.COMPTE_CREE, "UTILISATEUR", utilisateur.getId(),
                utilisateur.getEmail() + ", roles : " + utilisateur.getRoles());
        return UtilisateurDto.from(utilisateur);
    }

    @Transactional
    public UtilisateurDto modifierRoles(Long auteurId, Long utilisateurId, UpdateRolesRequest request) {
        Utilisateur utilisateur = verrouiller(auteurId, utilisateurId);
        if (utilisateurId.equals(auteurId) && !request.roles().contains(Role.ADMINISTRATEUR)) {
            throw ApiException.conflict(
                    "Vous ne pouvez pas retirer votre propre rôle d'administrateur : un autre administrateur doit le faire");
        }
        if (request.roles().isEmpty()) {
            throw ApiException.conflict("Le compte se retrouverait sans aucun rôle");
        }

        if (!estPersonnel(request.roles())) {
            utilisateur.setRestaurant(null);
        } else if (utilisateur.getRestaurant() == null) {
            if (request.restaurantId() == null) {
                throw ApiException.badRequest("Indiquez le restaurant de ce membre du personnel");
            }
            utilisateur.setRestaurant(trouverRestaurant(request.restaurantId()));
        }
        Set<Role> anciens = EnumSet.copyOf(utilisateur.getRoles());
        utilisateur.setRoles(EnumSet.copyOf(request.roles()));
        journalService.enregistrer(ActionJournal.ROLES_MODIFIES, "UTILISATEUR", utilisateur.getId(),
                anciens + " -> " + utilisateur.getRoles());
        return UtilisateurDto.from(utilisateur);
    }

    @Transactional
    public UtilisateurDto changerActivation(Long auteurId, Long utilisateurId, boolean actif) {
        Utilisateur utilisateur = verrouiller(auteurId, utilisateurId);
        if (!actif && utilisateurId.equals(auteurId)) {
            throw ApiException.conflict(
                    "Vous ne pouvez pas désactiver votre propre compte : un autre administrateur doit le faire");
        }
        // Un compte supprime par son titulaire n'a plus de donnees personnelles : il ne revient pas.
        if (actif && CompteService.estSupprime(utilisateur)) {
            throw ApiException.conflict("Ce compte a été supprimé par son titulaire : il ne peut pas être réactivé");
        }
        utilisateur.setEstActif(actif);
        journalService.enregistrer(actif ? ActionJournal.COMPTE_ACTIVE : ActionJournal.COMPTE_DESACTIVE,
                "UTILISATEUR", utilisateur.getId(), utilisateur.getEmail());
        return UtilisateurDto.from(utilisateur);
    }

    /**
     * Un administrateur ne peut ni retirer son propre role d'administrateur ni
     * desactiver son propre compte : seul un autre administrateur actif le peut,
     * et celui-ci reste en place. Pour que deux administrateurs ne se retirent pas
     * l'un l'autre au meme moment, l'auteur et le compte vise sont verrouilles,
     * puis on verifie que l'auteur est toujours un administrateur actif : la
     * seconde operation attend la premiere, puis elle est refusee. Il reste donc
     * toujours un administrateur actif.
     */
    private Utilisateur verrouiller(Long auteurId, Long utilisateurId) {
        List<Utilisateur> comptes = utilisateurRepository.findVerrouilles(
                Stream.of(auteurId, utilisateurId).distinct().toList());
        comptes.stream()
                .filter(compte -> compte.getId().equals(auteurId))
                .filter(auteur -> auteur.isEstActif() && auteur.getRoles().contains(Role.ADMINISTRATEUR))
                .findFirst()
                .orElseThrow(() -> ApiException.forbidden("Vous n'êtes plus administrateur"));
        return comptes.stream()
                .filter(compte -> compte.getId().equals(utilisateurId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }

    private static boolean estPersonnel(Set<Role> roles) {
        return roles.stream().anyMatch(ROLES_PERSONNEL::contains);
    }

    private Restaurant trouverRestaurant(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
    }
}
