package com.saes.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.domain.Role;
import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/**
 * Supervision d'un restaurant par l'administrateur : ECART ASSUME au cahier des
 * charges (§4.5 et §4.6 reservent ces consultations au gerant).
 *
 * <p>Ce que ces tests garantissent : l'administrateur voit les memes chiffres
 * que le gerant, les autres roles n'y ont pas acces, et l'acces reste en
 * lecture seule.
 */
class SupervisionAdminTest extends IntegrationTest {

    private static final String PERIODE = "?debut=2026-01-01&fin=2026-12-31";

    private String base() {
        return "/api/admin/restaurants/" + monde.restaurantId;
    }

    @Test
    void lAdministrateurVoitLesMemesChiffresQueLeGerant() {
        Monde.ok(monde.passerCommande(monde.jetonClient, monde.platId, 2));

        Reponse parGerant = api.get(monde.jetonGerant, "/api/gerant/statistiques-ventes" + PERIODE);
        Reponse parAdmin = api.get(monde.jetonAdmin, base() + "/statistiques-ventes" + PERIODE);

        assertThat(parAdmin.statut()).as(parAdmin.toString()).isEqualTo(200);
        assertThat(parAdmin.corps()).isEqualTo(parGerant.corps());

        assertThat(api.get(monde.jetonAdmin, base() + "/rapports-financiers" + PERIODE).statut())
                .isEqualTo(200);
        assertThat(api.get(monde.jetonAdmin, base() + "/stocks").statut()).isEqualTo(200);
        assertThat(api.get(monde.jetonAdmin, base() + "/recommandations").statut()).isEqualTo(200);
    }

    @Test
    void lesStocksVusParLAdminSontCeuxDuGerant() {
        Reponse gerant = api.get(monde.jetonGerant, "/api/gerant/ingredients");
        Reponse admin = api.get(monde.jetonAdmin, base() + "/stocks");

        assertThat(admin.corps()).isEqualTo(gerant.corps());
    }

    @Test
    void lesAutresRolesNAccedentPasALaSupervision() {
        for (String jeton : List.of(monde.jetonGerant, monde.jetonCaissier, monde.jetonServeur,
                monde.jetonCuisinier, monde.jetonClient)) {
            assertThat(api.get(jeton, base() + "/statistiques-ventes" + PERIODE).statut()).isEqualTo(403);
            assertThat(api.get(jeton, base() + "/rapports-financiers" + PERIODE).statut()).isEqualTo(403);
            assertThat(api.get(jeton, base() + "/stocks").statut()).isEqualTo(403);
            assertThat(api.get(jeton, base() + "/recommandations").statut()).isEqualTo(403);
        }
        assertThat(api.get(null, base() + "/stocks").statut()).isEqualTo(401);
    }

    @Test
    void lAdministrateurNePeutRienModifierDansLesDonneesDuGerant() {
        // Aucune route d'ecriture n'existe sous la supervision : le serveur refuse.
        int creation = api.post(monde.jetonAdmin, base() + "/stocks",
                Map.of("nom", "Intrus", "unite", "KILOGRAMME", "seuilAlerte", 1, "niveauCible", 2)).statut();
        assertThat(creation).isIn(404, 405);

        // Et les routes d'ecriture du gerant lui restent fermees.
        assertThat(api.post(monde.jetonAdmin, "/api/gerant/ingredients",
                Map.of("nom", "Intrus", "unite", "KILOGRAMME", "seuilAlerte", 1, "niveauCible", 2)).statut())
                .isEqualTo(403);
    }

    @Test
    void unRestaurantInconnuDonneUneErreurClaire() {
        assertThat(api.get(monde.jetonAdmin, "/api/admin/restaurants/999999/stocks").statut()).isEqualTo(404);
    }

    @Test
    void lAdministrateurVoitChaqueRestaurantSeparement() {
        Monde.ok(monde.passerCommande(monde.jetonClient, monde.platId, 1));
        Reponse autre = Monde.ok(api.post(monde.jetonAdmin, "/api/admin/restaurants",
                Monde.requeteRestaurant("Restaurant vide " + System.nanoTime())));

        Reponse statsAutre = api.get(monde.jetonAdmin,
                "/api/admin/restaurants/" + autre.id() + "/statistiques-ventes" + PERIODE);

        assertThat(statsAutre.statut()).isEqualTo(200);
        // Un restaurant tout neuf n'a rien vendu : il ne voit pas les ventes de l'autre.
        assertThat(statsAutre.entier("$.nombreCommandesPayees")).isZero();
        assertThat(Role.values()).contains(Role.ADMINISTRATEUR);
    }
}
