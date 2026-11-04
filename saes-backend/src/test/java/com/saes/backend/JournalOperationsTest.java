package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/** Historique des operations sensibles : qui, quoi, quand, sur quel objet. */
class JournalOperationsTest extends IntegrationTest {

    private Reponse journal() {
        return ok(api.get(monde.jetonAdmin, "/api/admin/journal?nombre=500"));
    }

    private List<Object> entrees(String action, long objetId, String champ) {
        return journal().liste("$[?(@.action == '" + action + "' && @.objetId == " + objetId + ")]." + champ);
    }

    private long id(String jeton) {
        return api.get(jeton, "/api/me").entier("$.id");
    }

    @Test
    void lesOperationsDeCaisseSontJournaliseesAvecLeCaissier() {
        long caissier = id(monde.jetonCaissier);
        long session = ok(api.post(monde.jetonCaissier, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", 10_000))).id();
        long commande = monde.commandePrete(monde.platId, 2);
        ok(monde.encaisser(commande, "ESPECES"));
        ok(api.put(monde.jetonCaissier, "/api/caissier/caisse/cloturer", Map.of("montantCompte", 13_500)));

        assertThat(entrees("CAISSE_OUVERTE", session, "acteurId")).containsExactly((int) caissier);
        assertThat(entrees("COMMANDE_ENCAISSEE", commande, "details")).singleElement().asString()
                .contains("4000 FCFA").contains("ESPECES");
        assertThat(entrees("CAISSE_CLOTUREE", session, "details")).singleElement().asString()
                .contains("Theorique : 14000").contains("ecart : -500");
    }

    @Test
    void annulationsAbandonsModificationsEtRupturesSontJournalises() {
        long annuleeParClient = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        ok(api.put(monde.jetonClient, "/api/commandes/" + annuleeParClient + "/annuler",
                Map.of("version", monde.version(annuleeParClient))));

        long modifiee = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        ok(api.put(monde.jetonServeur, "/api/serveur/commandes/" + modifiee, Map.of("version", monde.version(modifiee),
                "lignes", List.of(Map.of("platId", monde.platId, "quantite", 3)))));

        long abandonnee = monde.commandePrete(monde.platId, 1);
        ok(api.put(monde.jetonGerant, "/api/gerant/commandes/" + abandonnee + "/abandonner",
                Map.of("version", monde.version(abandonnee))));

        ok(api.post(monde.jetonCuisinier, "/api/cuisine/ingredients/" + monde.rizId + "/signaler-rupture", null));

        assertThat(entrees("COMMANDE_ANNULEE", annuleeParClient, "acteurId")).containsExactly((int) id(monde.jetonClient));
        assertThat(entrees("COMMANDE_MODIFIEE", modifiee, "details")).singleElement().asString().contains("6000 FCFA");
        assertThat(entrees("COMMANDE_ABANDONNEE", abandonnee, "acteurId")).containsExactly((int) id(monde.jetonGerant));
        assertThat(entrees("RUPTURE_SIGNALEE", monde.rizId, "details")).singleElement().asString()
                .contains("1 plat(s) desactive(s)").contains("ramene a zero");
    }

    @Test
    void lesOperationsDAdministrationSontJournaliseesSansAucunMotDePasse() {
        long serveur = id(monde.jetonServeur);
        ok(api.put(monde.jetonAdmin, "/api/admin/users/" + serveur + "/roles",
                Map.of("roles", List.of("SERVEUR", "CAISSIER"), "restaurantId", monde.restaurantId)));
        ok(api.put(monde.jetonAdmin, "/api/admin/users/" + serveur + "/desactiver", null));
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/desactiver", null));

        assertThat(entrees("ROLES_MODIFIES", serveur, "details")).containsExactly("[SERVEUR] -> [SERVEUR, CAISSIER]");
        assertThat(entrees("COMPTE_CREE", serveur, "acteurId")).containsExactly((int) id(monde.jetonAdmin));
        assertThat(entrees("COMPTE_DESACTIVE", serveur, "acteurId")).hasSize(1);
        assertThat(entrees("RESTAURANT_DESACTIVE", monde.restaurantId, "acteurId")).hasSize(1);
        assertThat(journal().corps()).doesNotContain(Monde.MOT_DE_PASSE).doesNotContain(monde.jetonAdmin);
    }

    @Test
    void uneOperationRefuseeNEstPasJournalisee() {
        long session = ok(api.post(monde.jetonCaissier, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", 0))).id();
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();

        assertThat(api.post(monde.jetonCaissier, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", 0)).statut())
                .isEqualTo(409);
        assertThat(monde.encaisser(commande, "ESPECES").statut()).as("commande pas prete").isEqualTo(409);

        long caissier = id(monde.jetonCaissier);
        assertThat(journal().liste("$[?(@.action == 'CAISSE_OUVERTE' && @.acteurId == " + caissier + ")].objetId"))
                .containsExactly((int) session);
        assertThat(entrees("COMMANDE_ENCAISSEE", commande, "id")).isEmpty();
    }

    @Test
    void leJournalLePlusRecentEstEnPremier() {
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/desactiver", null));
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/activer", null));

        assertThat(journal().<String>lire("$[0].action")).isEqualTo("RESTAURANT_ACTIVE");
        assertThat(journal().<String>lire("$[1].action")).isEqualTo("RESTAURANT_DESACTIVE");
    }
}
