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

/** Commandes (cahier des charges §4.3) et regles 1 a 4. */
class CommandesTest extends IntegrationTest {

    private Map<String, Object> lignes(long plat, int quantite) {
        return Map.of("platId", plat, "quantite", quantite);
    }

    // Client

    @Test
    void passerUneCommandeLEnregistreEnAttenteAvecSonMontant() {
        Reponse commande = monde.passerCommande(monde.jetonClient, monde.platId, 3);

        assertThat(commande.statut()).isEqualTo(201);
        assertThat(commande.<String>lire("$.statut")).isEqualTo("EN_ATTENTE");
        assertThat(commande.<String>lire("$.type")).isEqualTo("A_EMPORTER");
        assertThat(commande.entier("$.montantTotal")).isEqualTo(3L * Monde.PRIX_PLAT);
        assertThat(api.get(monde.jetonClient, "/api/commandes").liste("$[*].id")).contains((int) commande.id());
    }

    @Test
    void regle4LePrixEstCeluiDuMomentOuLePlatEstAjoute() {
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 2)).id();

        ok(api.put(monde.jetonGerant, "/api/gerant/plats/" + monde.platId, Map.of(
                "nom", "Thieboudienne", "prix", 5000, "categorie", "PLAT_PRINCIPAL",
                "recette", List.of(Map.of("ingredientId", monde.rizId, "quantiteNecessaire", 0.5)))));

        Reponse suivi = api.get(monde.jetonClient, "/api/commandes");
        assertThat(suivi.liste("$[?(@.id == " + commande + ")].montantTotal")).containsExactly(2 * Monde.PRIX_PLAT);
    }

    @Test
    void regle2UnPlatDesactiveOuHorsDeToutMenuNePeutPasEtreCommande() {
        ok(api.put(monde.jetonGerant, "/api/gerant/plats/" + monde.boissonId + "/desactiver", null));
        long horsMenu = monde.creerPlat("Plat hors menu", 1500, "PLAT_PRINCIPAL", monde.rizId, 0.2);

        assertThat(monde.passerCommande(monde.jetonClient, monde.boissonId, 1).statut()).isEqualTo(409);
        assertThat(monde.passerCommande(monde.jetonClient, horsMenu, 1).statut()).isEqualTo(409);
    }

    @Test
    void unPlatDUnMenuQuiNEstPlusEnVigueurNePeutPasEtreCommande() {
        LocalDate hier = LocalDate.now().minusDays(1);
        ok(api.put(monde.jetonGerant, "/api/gerant/menus/" + monde.menuId, Map.of(
                "nom", "Menu termine", "dateDebut", hier.minusDays(7).toString(), "dateFin", hier.toString(),
                "platIds", List.of(monde.platId))));

        assertThat(monde.passerCommande(monde.jetonClient, monde.platId, 1).statut()).isEqualTo(409);
    }

    @Test
    void passerUneCommandeEstRefuseSiLeRestaurantEstFerme() {
        // Ouvert seulement demain : ferme en ce moment.
        Map<String, Object> restaurant = Monde.requeteRestaurant("Ferme aujourd'hui");
        String jourDemain = switch (LocalDate.now().plusDays(1).getDayOfWeek()) {
            case MONDAY -> "LUNDI";
            case TUESDAY -> "MARDI";
            case WEDNESDAY -> "MERCREDI";
            case THURSDAY -> "JEUDI";
            case FRIDAY -> "VENDREDI";
            case SATURDAY -> "SAMEDI";
            case SUNDAY -> "DIMANCHE";
        };
        restaurant.put("horaires", List.of(
                Map.of("jour", jourDemain, "heureOuverture", "08:00:00", "heureFermeture", "20:00:00")));
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId, avecTables(restaurant)));

        Reponse commande = monde.passerCommande(monde.jetonClient, monde.platId, 1);

        assertThat(commande.statut()).isEqualTo(409);
    }

    @Test
    void regle13UnRestaurantDesactiveNAcceptePlusDeCommande() {
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/desactiver", null));

        assertThat(monde.passerCommande(monde.jetonClient, monde.platId, 1).statut()).isEqualTo(404);
    }

    @Test
    void annulerSaCommandeNEstPossibleQueSiElleEstEnAttente() {
        long enAttente = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        long enPreparation = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        ok(monde.demarrer(enPreparation));

        Reponse annulee = api.put(monde.jetonClient, "/api/commandes/" + enAttente + "/annuler",
                Map.of("version", monde.version(enAttente)));
        Reponse refusee = api.put(monde.jetonClient, "/api/commandes/" + enPreparation + "/annuler",
                Map.of("version", monde.version(enPreparation)));

        assertThat(annulee.<String>lire("$.statut")).isEqualTo("ANNULEE");
        assertThat(refusee.statut()).isEqualTo(409);
    }

    // Serveur

    @Test
    void prendreUneCommandeSurPlaceExigeUneTableDuRestaurant() {
        Reponse sansTable = api.post(monde.jetonServeur, "/api/serveur/commandes",
                Map.of("type", "SUR_PLACE", "lignes", List.of(lignes(monde.platId, 1))));
        Reponse avecTable = api.post(monde.jetonServeur, "/api/serveur/commandes", Map.of(
                "type", "SUR_PLACE", "tableId", monde.tables.get(1), "lignes", List.of(lignes(monde.platId, 2))));

        assertThat(sansTable.statut()).isEqualTo(400);
        assertThat(avecTable.statut()).isEqualTo(201);
        assertThat(avecTable.entier("$.tableNumero")).isEqualTo(1);
        assertThat(avecTable.entier("$.montantTotal")).isEqualTo(2L * Monde.PRIX_PLAT);
    }

    @Test
    void modifierUneCommandeLaLaisseEnAttenteAvecSonNouveauMontant() {
        long id = ok(api.post(monde.jetonServeur, "/api/serveur/commandes",
                Map.of("type", "A_EMPORTER", "lignes", List.of(lignes(monde.platId, 1))))).id();

        Reponse modifiee = api.put(monde.jetonServeur, "/api/serveur/commandes/" + id, Map.of(
                "version", monde.version(id),
                "lignes", List.of(lignes(monde.platId, 1), lignes(monde.boissonId, 2))));

        assertThat(modifiee.statut()).isEqualTo(200);
        assertThat(modifiee.<String>lire("$.statut")).isEqualTo("EN_ATTENTE");
        assertThat(modifiee.entier("$.montantTotal")).isEqualTo(Monde.PRIX_PLAT + 2L * Monde.PRIX_BOISSON);
    }

    @Test
    void modifierOuAnnulerEstRefuseQuandLaCommandeNEstPlusEnAttente() {
        long id = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        ok(monde.demarrer(id));

        assertThat(api.put(monde.jetonServeur, "/api/serveur/commandes/" + id, Map.of(
                "version", monde.version(id), "lignes", List.of(lignes(monde.platId, 2)))).statut()).isEqualTo(409);
        assertThat(api.put(monde.jetonServeur, "/api/serveur/commandes/" + id + "/annuler",
                Map.of("version", monde.version(id))).statut()).isEqualTo(409);
    }

    @Test
    void regle3UneActionSurUneCommandeQuiAChangeEstRefuseeEtRenvoieLaCommandeAJour() {
        long id = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        long versionAffichee = monde.version(id);

        // Un autre serveur modifie la commande entre-temps.
        ok(api.put(monde.jetonServeur, "/api/serveur/commandes/" + id, Map.of(
                "version", versionAffichee, "lignes", List.of(lignes(monde.platId, 4)))));

        Reponse conflit = api.put(monde.jetonServeur, "/api/serveur/commandes/" + id + "/annuler",
                Map.of("version", versionAffichee));

        assertThat(conflit.statut()).isEqualTo(409);
        assertThat(conflit.entier("$.commandeActuelle.id")).isEqualTo(id);
        assertThat(conflit.entier("$.commandeActuelle.montantTotal")).isEqualTo(4L * Monde.PRIX_PLAT);
    }

    @Test
    void laVersionRenvoyeeApresUneActionPermetLActionSuivante() {
        long id = ok(api.post(monde.jetonServeur, "/api/serveur/commandes",
                Map.of("type", "A_EMPORTER", "lignes", List.of(lignes(monde.platId, 1))))).id();

        Reponse modifiee = ok(api.put(monde.jetonServeur, "/api/serveur/commandes/" + id, Map.of(
                "version", monde.version(id), "lignes", List.of(lignes(monde.platId, 2)))));

        assertThat(modifiee.entier("$.version")).isEqualTo(monde.version(id));
        Reponse annulee = api.put(monde.jetonServeur, "/api/serveur/commandes/" + id + "/annuler",
                Map.of("version", modifiee.entier("$.version")));
        assertThat(annulee.statut()).as(annulee.toString()).isEqualTo(200);
    }

    @Test
    void chaqueActionRenvoieLaVersionEnregistreeUtilisablePourLaSuivante() {
        ok(api.post(monde.jetonCaissier, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", 0)));
        long id = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();

        Reponse demarree = ok(api.put(monde.jetonCuisinier, "/api/cuisine/commandes/" + id + "/demarrer",
                Map.of("version", monde.version(id))));
        assertThat(demarree.entier("$.version")).isEqualTo(monde.version(id));

        Reponse terminee = ok(api.put(monde.jetonCuisinier, "/api/cuisine/commandes/" + id + "/terminer",
                Map.of("version", demarree.entier("$.version"))));
        assertThat(terminee.entier("$.version")).isEqualTo(monde.version(id));

        Reponse payee = api.put(monde.jetonCaissier, "/api/caissier/commandes/" + id + "/encaisser",
                Map.of("modePaiement", "ESPECES", "version", terminee.entier("$.version")));
        assertThat(payee.statut()).as(payee.toString()).isEqualTo(200);
        assertThat(payee.entier("$.version")).isEqualTo(monde.version(id));
    }

    @Test
    void uneTableEstOccupeeTantQueSaCommandeNEstNiPayeeNiAnnulee() {
        long table = monde.tables.get(2);
        long id = ok(api.post(monde.jetonServeur, "/api/serveur/commandes", Map.of(
                "type", "SUR_PLACE", "tableId", table, "lignes", List.of(lignes(monde.platId, 1))))).id();

        String chemin = "$.tables[?(@.id == " + table + ")].occupee";
        assertThat(api.get(monde.jetonServeur, "/api/serveur/occupation-tables").liste(chemin)).containsExactly(true);

        ok(api.put(monde.jetonServeur, "/api/serveur/commandes/" + id + "/annuler", Map.of("version", monde.version(id))));

        assertThat(api.get(monde.jetonServeur, "/api/serveur/occupation-tables").liste(chemin)).containsExactly(false);
    }

    // Gerant

    @Test
    void declarerAbandonneeUneCommandeEnPreparationOuPreteSeulement() {
        long enAttente = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        long enPreparation = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        ok(monde.demarrer(enPreparation));
        long prete = monde.commandePrete(monde.platId, 1);

        assertThat(api.put(monde.jetonGerant, "/api/gerant/commandes/" + enAttente + "/abandonner",
                Map.of("version", monde.version(enAttente))).statut()).isEqualTo(409);
        assertThat(api.put(monde.jetonGerant, "/api/gerant/commandes/" + enPreparation + "/abandonner",
                Map.of("version", monde.version(enPreparation))).<String>lire("$.statut")).isEqualTo("ABANDONNEE");
        assertThat(api.put(monde.jetonGerant, "/api/gerant/commandes/" + prete + "/abandonner",
                Map.of("version", monde.version(prete))).<String>lire("$.statut")).isEqualTo("ABANDONNEE");
    }

    @Test
    void regle1UneCommandePayeeAnnuleeOuAbandonneeNeChangePlus() {
        ok(api.post(monde.jetonCaissier, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", 0)));
        long payee = monde.commandePrete(monde.platId, 1);
        ok(monde.encaisser(payee, "ESPECES"));

        assertThat(api.put(monde.jetonGerant, "/api/gerant/commandes/" + payee + "/abandonner",
                Map.of("version", monde.version(payee))).statut()).isEqualTo(409);
        assertThat(monde.demarrer(payee).statut()).isEqualTo(409);
        assertThat(commandeRepository.findById(payee).orElseThrow().getStatut().name()).isEqualTo("PAYEE");
    }

    private Map<String, Object> avecTables(Map<String, Object> requete) {
        requete.put("tables", List.of(
                Map.of("id", monde.tables.get(1), "numero", 1, "capacite", 2),
                Map.of("id", monde.tables.get(2), "numero", 2, "capacite", 4),
                Map.of("id", monde.tables.get(3), "numero", 3, "capacite", 6)));
        return requete;
    }
}
