package com.saes.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.domain.Role;
import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/**
 * Qualite attendue §6.1 : chaque utilisateur n'accede qu'aux fonctions de ses
 * roles ; le personnel n'exerce ses roles que dans son restaurant (§3).
 */
class DroitsAccesTest extends IntegrationTest {

    /** Une route en lecture par espace de l'API, et le seul role qui y a droit. */
    private static final Map<String, Role> ESPACES = new LinkedHashMap<>();

    static {
        ESPACES.put("/api/admin/users", Role.ADMINISTRATEUR);
        ESPACES.put("/api/admin/restaurants", Role.ADMINISTRATEUR);
        ESPACES.put("/api/commandes", Role.CLIENT);
        ESPACES.put("/api/reservations", Role.CLIENT);
        ESPACES.put("/api/serveur/commandes", Role.SERVEUR);
        ESPACES.put("/api/serveur/occupation-tables", Role.SERVEUR);
        ESPACES.put("/api/cuisine/commandes", Role.CUISINIER);
        ESPACES.put("/api/cuisine/ingredients", Role.CUISINIER);
        ESPACES.put("/api/caissier/commandes", Role.CAISSIER);
        ESPACES.put("/api/gerant/commandes", Role.GERANT);
        ESPACES.put("/api/gerant/plats", Role.GERANT);
        ESPACES.put("/api/gerant/menus", Role.GERANT);
        ESPACES.put("/api/gerant/ingredients", Role.GERANT);
        ESPACES.put("/api/gerant/recommandations", Role.GERANT);
        ESPACES.put("/api/gerant/rapports-financiers?debut=2026-01-01&fin=2026-12-31", Role.GERANT);
        ESPACES.put("/api/gerant/statistiques-ventes?debut=2026-01-01&fin=2026-12-31", Role.GERANT);
    }

    private Map<Role, String> jetonsParRole() {
        Map<Role, String> jetons = new LinkedHashMap<>();
        jetons.put(Role.ADMINISTRATEUR, monde.jetonAdmin);
        jetons.put(Role.CLIENT, monde.jetonClient);
        jetons.put(Role.SERVEUR, monde.jetonServeur);
        jetons.put(Role.CUISINIER, monde.jetonCuisinier);
        jetons.put(Role.CAISSIER, monde.jetonCaissier);
        jetons.put(Role.GERANT, monde.jetonGerant);
        return jetons;
    }

    @Test
    void chaqueRoleNAccedeQuAuxFonctionsDeSonRole() {
        for (var espace : ESPACES.entrySet()) {
            for (var role : jetonsParRole().entrySet()) {
                int statut = api.get(role.getValue(), espace.getKey()).statut();
                int attendu = role.getKey() == espace.getValue() ? 200 : 403;
                assertThat(statut)
                        .as("%s avec le role %s", espace.getKey(), role.getKey())
                        .isEqualTo(attendu);
            }
        }
    }

    @Test
    void unCompteAPlusieursRolesAccedeAuxFonctionsDeChacun() {
        String gerantCaissier = monde.nouveauPersonnel(monde.restaurantId, Role.GERANT, Role.CAISSIER);

        assertThat(api.get(gerantCaissier, "/api/gerant/plats").statut()).isEqualTo(200);
        assertThat(api.get(gerantCaissier, "/api/caissier/commandes").statut()).isEqualTo(200);
        assertThat(api.get(gerantCaissier, "/api/cuisine/commandes").statut()).isEqualTo(403);
    }

    @Test
    void unRoleRetireNEstPlusAccepteMemeAvecUnJetonDejaDelivre() {
        long serveurId = api.get(monde.jetonServeur, "/api/me").entier("$.id");
        assertThat(api.get(monde.jetonServeur, "/api/serveur/commandes").statut()).isEqualTo(200);

        Reponse modification = api.put(monde.jetonAdmin, "/api/admin/users/" + serveurId + "/roles",
                Map.of("roles", List.of("CUISINIER"), "restaurantId", monde.restaurantId));
        assertThat(modification.statut()).as(modification.toString()).isEqualTo(200);

        assertThat(api.get(monde.jetonServeur, "/api/serveur/commandes").statut()).isEqualTo(403);
        assertThat(api.get(monde.jetonServeur, "/api/cuisine/commandes").statut()).isEqualTo(200);
    }

    @Test
    void lePersonnelNAgitQueDansSonRestaurant() {
        long commandeA = Monde.ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        long platA = monde.platId;

        Reponse restaurantB = Monde.ok(api.post(monde.jetonAdmin, "/api/admin/restaurants",
                Monde.requeteRestaurant("Autre restaurant " + System.nanoTime())));
        String gerantB = monde.nouveauPersonnel(restaurantB.id(), Role.GERANT);
        String serveurB = monde.nouveauPersonnel(restaurantB.id(), Role.SERVEUR);
        String cuisinierB = monde.nouveauPersonnel(restaurantB.id(), Role.CUISINIER);

        assertThat(api.put(gerantB, "/api/gerant/plats/" + platA + "/desactiver", null).statut()).isEqualTo(403);
        assertThat(api.put(serveurB, "/api/serveur/commandes/" + commandeA + "/annuler",
                Map.of("version", monde.version(commandeA))).statut()).isEqualTo(403);
        assertThat(api.put(cuisinierB, "/api/cuisine/commandes/" + commandeA + "/demarrer",
                Map.of("version", monde.version(commandeA))).statut()).isEqualTo(403);
        assertThat(api.get(serveurB, "/api/serveur/commandes").liste("$[*].id")).doesNotContain((int) commandeA);
    }

    @Test
    void unClientNeVoitNiNAnnuleLesCommandesDUnAutreClient() {
        long commande = Monde.ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        String autreClient = monde.nouveauClient();

        assertThat(api.get(autreClient, "/api/commandes").liste("$")).isEmpty();
        assertThat(api.put(autreClient, "/api/commandes/" + commande + "/annuler",
                Map.of("version", monde.version(commande))).statut()).isEqualTo(403);
    }
}
