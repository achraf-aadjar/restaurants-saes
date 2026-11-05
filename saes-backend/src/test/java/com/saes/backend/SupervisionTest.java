package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/**
 * Espace d'administration : l'administrateur voit tous les restaurants, en
 * lecture. La base de test est partagee : on verifie les donnees du restaurant
 * du monde de test, et des minimums pour les totaux globaux.
 */
class SupervisionTest extends IntegrationTest {

    private String nomRestaurant() {
        return ok(api.get(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId)).lire("$.nom");
    }

    /** 4 000 FCFA en especes, 1 000 en Mobile Money, une commande abandonnee de 2 000, caisse cloturee. */
    private long scenario() {
        long session = ok(api.post(monde.jetonCaissier, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", 5_000))).id();
        ok(monde.encaisser(monde.commandePrete(monde.platId, 2), "ESPECES"));
        ok(monde.encaisser(monde.commandePrete(monde.boissonId, 2), "MOBILE_MONEY"));
        long abandonnee = monde.commandePrete(monde.platId, 1);
        ok(api.put(monde.jetonGerant, "/api/gerant/commandes/" + abandonnee + "/abandonner",
                Map.of("version", monde.version(abandonnee))));
        ok(api.put(monde.jetonCaissier, "/api/caissier/caisse/cloturer", Map.of("montantCompte", 8_500)));
        return session;
    }

    @Test
    void leTableauDeBordDonneLeChiffreDAffairesDeChaqueRestaurant() {
        scenario();
        String aujourdHui = LocalDate.now().toString();

        Reponse tableau = ok(api.get(monde.jetonAdmin,
                "/api/admin/supervision/tableau-de-bord?debut=" + aujourdHui + "&fin=" + aujourdHui));

        String restaurant = "$.finances.parRestaurant[?(@.restaurantId == " + monde.restaurantId + ")]";
        assertThat(tableau.liste(restaurant + ".chiffreAffaires")).containsExactly(5_000);
        assertThat(tableau.liste(restaurant + ".commandesPayees")).containsExactly(2);
        assertThat(tableau.entier("$.finances.chiffreAffaires")).isGreaterThanOrEqualTo(5_000);
        assertThat(tableau.entier("$.finances.montantAbandonne")).isGreaterThanOrEqualTo(2_000);
        assertThat(tableau.liste("$.finances.parJour[*].jour")).containsExactly(aujourdHui);
        assertThat(tableau.entier("$.indicateurs.restaurantsActifs")).isGreaterThanOrEqualTo(1);
        assertThat(tableau.entier("$.indicateurs.comptesParRole.CAISSIER")).isGreaterThanOrEqualTo(1);
        assertThat(tableau.liste("$.activiteRecente")).isNotEmpty();
    }

    @Test
    void laPeriodeParDefautCouvreLes30DerniersJoursJourParJour() {
        Reponse tableau = ok(api.get(monde.jetonAdmin, "/api/admin/supervision/tableau-de-bord"));

        assertThat(tableau.liste("$.finances.parJour")).hasSize(30);
        assertThat(tableau.<String>lire("$.finances.parJour[29].jour")).isEqualTo(LocalDate.now().toString());
    }

    @Test
    void uneCommandeEnCoursApparaitDansLesIndicateursEtLaListeDesCommandes() {
        long enAttente = ok(monde.passerCommande(monde.jetonClient, monde.platId, 3)).id();

        Reponse commandes = ok(api.get(monde.jetonAdmin, "/api/admin/supervision/commandes"));

        String ligne = "$[?(@.id == " + enAttente + ")]";
        assertThat(commandes.liste(ligne + ".restaurant")).containsExactly(nomRestaurant());
        assertThat(commandes.liste(ligne + ".montantTotal")).containsExactly(3 * Monde.PRIX_PLAT);
        assertThat(commandes.liste(ligne + ".statut")).containsExactly("EN_ATTENTE");
        assertThat(commandes.liste(ligne + ".passeePar")).singleElement().asString().startsWith("Client : ");
        assertThat(ok(api.get(monde.jetonAdmin, "/api/admin/supervision/tableau-de-bord"))
                .entier("$.indicateurs.commandesEnCours.EN_ATTENTE")).isGreaterThanOrEqualTo(1);
    }

    @Test
    void lesCaissesMontrentEncaissementsTheoriqueEtEcart() {
        long session = scenario();

        Reponse caisses = ok(api.get(monde.jetonAdmin, "/api/admin/supervision/caisses"));

        String ligne = "$[?(@.id == " + session + ")]";
        assertThat(caisses.liste(ligne + ".encaisseEspeces")).containsExactly(4_000);
        assertThat(caisses.liste(ligne + ".encaisseMobileMoney")).containsExactly(1_000);
        assertThat(caisses.liste(ligne + ".montantTheorique")).containsExactly(9_000);
        assertThat(caisses.liste(ligne + ".ecart")).containsExactly(-500);
    }

    @Test
    void lesStocksDeTousLesRestaurantsSignalentLesAlertes() {
        ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "SORTIE", "quantite", 9.5)));

        Reponse stocks = ok(api.get(monde.jetonAdmin, "/api/admin/supervision/stocks"));

        String ligne = "$[?(@.ingredientId == " + monde.rizId + ")]";
        assertThat(stocks.liste(ligne + ".alerte")).containsExactly(true);
        assertThat(stocks.liste(ligne + ".aReapprovisionner")).containsExactly(19.5);
        assertThat(stocks.liste(ligne + ".restaurant")).containsExactly(nomRestaurant());
    }

    @Test
    void lesReservationsAVenirSontVisibles() {
        long reservation = ok(api.post(monde.jetonClient, "/api/reservations", Map.of(
                "restaurantId", monde.restaurantId,
                "dateHeure", LocalDate.now().plusDays(1).atTime(12, 0).toString(),
                "nombreCouverts", 5))).id();

        Reponse reservations = ok(api.get(monde.jetonAdmin, "/api/admin/supervision/reservations"));

        assertThat(reservations.liste("$[?(@.id == " + reservation + ")].tables")).containsExactly(java.util.List.of(3));
    }

    @Test
    void laSupervisionEstEnLectureSeuleEtReserveeALAdministrateur() {
        assertThat(api.get(monde.jetonGerant, "/api/admin/supervision/tableau-de-bord").statut()).isEqualTo(403);
        assertThat(api.post(monde.jetonAdmin, "/api/admin/supervision/caisses", Map.of()).statut()).isEqualTo(405);
        assertThat(api.get(monde.jetonAdmin, "/api/admin/supervision/commandes?debut=2026-02-01&fin=2026-01-01").statut())
                .isEqualTo(400);
    }
}
