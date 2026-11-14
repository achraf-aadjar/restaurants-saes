package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/** Administration (cahier des charges §4.7) et Gerer son compte (§4.1). */
class AdministrationTest extends IntegrationTest {

    private Map<String, Object> personnel(String email, List<String> roles) {
        return Map.of("nom", "Sow", "prenom", "Ibra", "email", email, "motDePasse", Monde.MOT_DE_PASSE,
                "restaurantId", monde.restaurantId, "roles", roles);
    }

    // Gerer les comptes utilisateurs

    @Test
    void creerUnCompteDuPersonnelLeRattacheASonRestaurant() {
        String email = "serveur-" + System.nanoTime() + "@test.sn";

        Reponse cree = api.post(monde.jetonAdmin, "/api/admin/users", personnel(email, List.of("SERVEUR")));

        assertThat(cree.statut()).isEqualTo(201);
        assertThat(cree.liste("$.roles")).containsExactly("SERVEUR");
        assertThat(cree.entier("$.restaurantId")).isEqualTo(monde.restaurantId);
    }

    @Test
    void creerUnCompteEstRefuseSiLAdresseEstDejaUtiliseeOuSansRoleDuPersonnel() {
        String email = "doublon-" + System.nanoTime() + "@test.sn";
        ok(api.post(monde.jetonAdmin, "/api/admin/users", personnel(email, List.of("CUISINIER"))));

        assertThat(api.post(monde.jetonAdmin, "/api/admin/users", personnel(email, List.of("SERVEUR"))).statut())
                .isEqualTo(409);
        assertThat(api.post(monde.jetonAdmin, "/api/admin/users",
                personnel("vide-" + System.nanoTime() + "@test.sn", List.of())).statut()).isEqualTo(400);
        assertThat(api.post(monde.jetonAdmin, "/api/admin/users",
                personnel("client-" + System.nanoTime() + "@test.sn", List.of("CLIENT"))).statut()).isEqualTo(400);
    }

    @Test
    void unCompteNePeutPasSeRetrouverSansAucunRole() {
        long serveurId = api.get(monde.jetonServeur, "/api/me").entier("$.id");

        Reponse reponse = api.put(monde.jetonAdmin, "/api/admin/users/" + serveurId + "/roles",
                Map.of("roles", List.of(), "restaurantId", monde.restaurantId));

        assertThat(reponse.statut()).isEqualTo(409);
    }

    @Test
    void unCompteDesactivePuisReactivePeutDeNouveauSeConnecter() {
        long serveurId = api.get(monde.jetonServeur, "/api/me").entier("$.id");
        String email = api.get(monde.jetonServeur, "/api/me").lire("$.email");

        ok(api.put(monde.jetonAdmin, "/api/admin/users/" + serveurId + "/desactiver", null));
        assertThat(api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", Monde.MOT_DE_PASSE))
                .statut()).isEqualTo(401);

        ok(api.put(monde.jetonAdmin, "/api/admin/users/" + serveurId + "/activer", null));
        assertThat(api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", Monde.MOT_DE_PASSE))
                .statut()).isEqualTo(200);
    }

    @Test
    void unCompteSupprimeParSonTitulaireNePeutPasEtreReactive() {
        String jeton = monde.nouveauClient();
        long clientId = api.get(jeton, "/api/me").entier("$.id");
        assertThat(api.delete(jeton, "/api/me").statut()).isEqualTo(204);

        Reponse reactivation = api.put(monde.jetonAdmin, "/api/admin/users/" + clientId + "/activer", null);

        assertThat(reactivation.statut()).as(reactivation.toString()).isEqualTo(409);
    }

    // Gerer les restaurants

    @Test
    void deuxTablesNePeuventPasAvoirLeMemeNumero() {
        Map<String, Object> requete = Monde.requeteRestaurant("Doublon de table");
        requete.put("tables", List.of(Map.of("numero", 1, "capacite", 2), Map.of("numero", 1, "capacite", 4)));

        assertThat(api.post(monde.jetonAdmin, "/api/admin/restaurants", requete).statut()).isEqualTo(409);
    }

    @Test
    void deuxPlagesDUnMemeJourNePeuventPasSeChevaucher() {
        Map<String, Object> requete = Monde.requeteRestaurant("Plages chevauchantes");
        requete.put("horaires", List.of(
                Map.of("jour", "LUNDI", "heureOuverture", "08:00:00", "heureFermeture", "14:00:00"),
                Map.of("jour", "LUNDI", "heureOuverture", "13:00:00", "heureFermeture", "20:00:00")));

        assertThat(api.post(monde.jetonAdmin, "/api/admin/restaurants", requete).statut()).isEqualTo(409);
    }

    @Test
    void unRestaurantAAuMoinsUneTableEtUnePlageDansLaSemaine() {
        Map<String, Object> sansTable = Monde.requeteRestaurant("Sans table");
        sansTable.put("tables", List.of());
        Map<String, Object> sansHoraire = Monde.requeteRestaurant("Sans horaire");
        sansHoraire.put("horaires", List.of());

        assertThat(api.post(monde.jetonAdmin, "/api/admin/restaurants", sansTable).statut()).isEqualTo(400);
        assertThat(api.post(monde.jetonAdmin, "/api/admin/restaurants", sansHoraire).statut()).isEqualTo(400);
    }

    @Test
    void regle13UnRestaurantDesactiveNEstPlusProposePuisRevientUneFoisReactive() {
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/desactiver", null));
        assertThat(api.get(null, "/api/public/restaurants").liste("$[*].id")).doesNotContain((int) monde.restaurantId);

        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/activer", null));
        assertThat(api.get(null, "/api/public/restaurants").liste("$[*].id")).contains((int) monde.restaurantId);
    }

    // Gerer son compte

    @Test
    void changerSonMotDePasseExigeLeMotDePasseActuel() {
        String email = api.get(monde.jetonClient, "/api/me").lire("$.email");
        Map<String, Object> mauvais = Map.of("nom", "Diop", "prenom", "Awa", "email", email,
                "motDePasseActuel", "pas-le-bon", "nouveauMotDePasse", "nouveau-mot-123");
        Map<String, Object> bon = Map.of("nom", "Diop", "prenom", "Awa", "email", email,
                "motDePasseActuel", Monde.MOT_DE_PASSE, "nouveauMotDePasse", "nouveau-mot-123");

        assertThat(api.put(monde.jetonClient, "/api/me", mauvais).statut()).isEqualTo(400);
        assertThat(api.put(monde.jetonClient, "/api/me", bon).statut()).isEqualTo(200);
        assertThat(api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", "nouveau-mot-123"))
                .statut()).isEqualTo(200);
    }

    @Test
    void unClientQuiSupprimeSonCompteEstAnonymiseEtSesReservationsAVenirAnnulees() {
        String email = api.get(monde.jetonClient, "/api/me").lire("$.email");
        long reservation = ok(api.post(monde.jetonClient, "/api/reservations", Map.of(
                "restaurantId", monde.restaurantId,
                "dateHeure", LocalDate.now().plusDays(1).atTime(12, 0).toString(),
                "nombreCouverts", 6))).id();
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();

        assertThat(api.delete(monde.jetonClient, "/api/me").statut()).isEqualTo(204);

        assertThat(api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", Monde.MOT_DE_PASSE))
                .statut()).isEqualTo(401);
        // La table de 6 est de nouveau libre sur ce creneau.
        Reponse nouvelle = ok(api.post(monde.nouveauClient(), "/api/reservations", Map.of(
                "restaurantId", monde.restaurantId,
                "dateHeure", LocalDate.now().plusDays(1).atTime(12, 0).toString(),
                "nombreCouverts", 6)));
        assertThat(nouvelle.liste("$.tables[*].numero")).containsExactly(3);
        assertThat(nouvelle.id()).isNotEqualTo(reservation);
        // La commande reste enregistree (comptes du restaurant) et l'adresse est liberee.
        assertThat(commandeRepository.findById(commande)).isPresent();
        assertThat(api.post(null, "/api/auth/register", Map.of(
                "nom", "Diop", "prenom", "Awa", "email", email, "motDePasse", Monde.MOT_DE_PASSE)).statut())
                .isEqualTo(201);
    }

    @Test
    void seulUnCompteClientPeutEtreSupprimeParSonTitulaire() {
        assertThat(api.delete(monde.jetonServeur, "/api/me").statut()).isEqualTo(403);
    }
}
