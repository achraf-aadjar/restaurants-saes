package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.JournalOperation;
import com.saes.backend.repository.JournalOperationRepository;
import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/** Historique des operations sensibles : qui, quoi, quand, sur quel objet. */
class JournalOperationsTest extends IntegrationTest {

    @Autowired
    private JournalOperationRepository journalOperationRepository;

    private Reponse journal() {
        return ok(api.get(monde.jetonAdmin, "/api/admin/journal?nombre=500"));
    }

    private List<Object> entrees(String action, long objetId, String champ) {
        return journal().liste("$[?(@.action == '" + action + "' && @.objetId == " + objetId + ")]." + champ);
    }

    /**
     * Entrees lues en base : les operations de caisse et de commandes sont
     * enregistrees, mais l'historique de l'administrateur ne les montre pas.
     */
    private List<JournalOperation> enregistrees(ActionJournal action, long objetId) {
        return journalOperationRepository.findAll().stream()
                .filter(j -> j.getAction() == action && Long.valueOf(objetId).equals(j.getObjetId()))
                .toList();
    }

    private List<Long> acteurs(ActionJournal action, long objetId) {
        return enregistrees(action, objetId).stream().map(j -> j.getActeur().getId()).toList();
    }

    private List<String> details(ActionJournal action, long objetId) {
        return enregistrees(action, objetId).stream().map(JournalOperation::getDetails).toList();
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

        assertThat(acteurs(ActionJournal.CAISSE_OUVERTE, session)).containsExactly(caissier);
        assertThat(details(ActionJournal.COMMANDE_ENCAISSEE, commande)).singleElement().asString()
                .contains("4000 FCFA").contains("ESPECES");
        assertThat(details(ActionJournal.CAISSE_CLOTUREE, session)).singleElement().asString()
                .contains("Theorique : 14000").contains("ecart : -500");
        assertThat(journal().liste("$[*].action")).as("l'historique de l'administrateur : son domaine seulement")
                .isNotEmpty()
                .allMatch(action -> ActionJournal.ADMINISTRATION.contains(ActionJournal.valueOf((String) action)));
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

        assertThat(acteurs(ActionJournal.COMMANDE_ANNULEE, annuleeParClient)).containsExactly(id(monde.jetonClient));
        assertThat(details(ActionJournal.COMMANDE_MODIFIEE, modifiee)).singleElement().asString().contains("6000 FCFA");
        assertThat(acteurs(ActionJournal.COMMANDE_ABANDONNEE, abandonnee)).containsExactly(id(monde.jetonGerant));
        assertThat(details(ActionJournal.RUPTURE_SIGNALEE, monde.rizId)).singleElement().asString()
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
        assertThat(journalOperationRepository.findAll().stream()
                .filter(j -> j.getAction() == ActionJournal.CAISSE_OUVERTE && j.getActeur().getId() == caissier)
                .map(JournalOperation::getObjetId)).containsExactly(session);
        assertThat(enregistrees(ActionJournal.COMMANDE_ENCAISSEE, commande)).isEmpty();
    }

    @Test
    void leJournalLePlusRecentEstEnPremier() {
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/desactiver", null));
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/activer", null));

        assertThat(journal().<String>lire("$[0].action")).isEqualTo("RESTAURANT_ACTIVE");
        assertThat(journal().<String>lire("$[1].action")).isEqualTo("RESTAURANT_DESACTIVE");
    }
}
