package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.saes.backend.domain.Role;
import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/** Finances (cahier des charges §4.5), statistiques de ventes (§4.6), regles 1 et 5. */
class FinancesTest extends IntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    private Reponse ouvrirCaisse(String jeton, int fond) {
        return api.post(jeton, "/api/caissier/caisse/ouvrir", Map.of("fondDeCaisse", fond));
    }

    private Reponse cloturer(String jeton, int compte) {
        return api.put(jeton, "/api/caissier/caisse/cloturer", Map.of("montantCompte", compte));
    }

    // Ouvrir la caisse

    @Test
    void ouvrirSaCaisseEstRefuseSiElleEstDejaOuverte() {
        Reponse ouverte = ouvrirCaisse(monde.jetonCaissier, 10_000);

        assertThat(ouverte.statut()).isEqualTo(201);
        assertThat(ouverte.entier("$.fondDeCaisse")).isEqualTo(10_000);
        assertThat(ouvrirCaisse(monde.jetonCaissier, 5_000).statut()).isEqualTo(409);
    }

    @Test
    void deuxOuverturesSimultaneesNOuvrentQuUneSeuleCaisse() throws Exception {
        List<Integer> statuts = enMemeTemps(List.of(
                () -> ouvrirCaisse(monde.jetonCaissier, 10_000).statut(),
                () -> ouvrirCaisse(monde.jetonCaissier, 10_000).statut()));

        assertThat(statuts).containsExactlyInAnyOrder(201, 409);
        long caissierId = api.get(monde.jetonCaissier, "/api/me").entier("$.id");
        assertThat(jdbc.queryForObject(
                "select count(*) from session_caisse where caissier_id = ? and date_heure_cloture is null",
                Integer.class, caissierId)).isEqualTo(1);
    }

    // Encaisser une commande

    @Test
    void encaisserEstRefuseSansCaisseOuverteOuSiLaCommandeNEstPasPrete() {
        long prete = monde.commandePrete(monde.platId, 1);
        long enAttente = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();

        assertThat(monde.encaisser(prete, "ESPECES").statut()).as("sans caisse ouverte").isEqualTo(409);

        ok(ouvrirCaisse(monde.jetonCaissier, 0));
        assertThat(monde.encaisser(enAttente, "ESPECES").statut()).as("commande pas prete").isEqualTo(409);
        assertThat(monde.encaisser(prete, "MOBILE_MONEY").<String>lire("$.statut")).isEqualTo("PAYEE");
        assertThat(api.get(monde.jetonCaissier, "/api/caissier/commandes").liste("$[*].id")).doesNotContain((int) prete);
    }

    @Test
    void regle5UneCommandeNEstPayeeQuUneFois() {
        ok(ouvrirCaisse(monde.jetonCaissier, 0));
        long commande = monde.commandePrete(monde.platId, 1);
        ok(monde.encaisser(commande, "ESPECES"));

        assertThat(monde.encaisser(commande, "MOBILE_MONEY").statut()).isEqualTo(409);
        assertThat(paiements(commande)).isEqualTo(1);
    }

    @Test
    void deuxEncaissementsSimultanesDeLaMemeCommandeNEnregistrentQuUnPaiement() throws Exception {
        String autreCaissier = monde.nouveauPersonnel(monde.restaurantId, Role.CAISSIER);
        ok(ouvrirCaisse(monde.jetonCaissier, 0));
        ok(ouvrirCaisse(autreCaissier, 0));
        long commande = monde.commandePrete(monde.platId, 1);
        long version = monde.version(commande);
        Map<String, Object> corps = Map.of("modePaiement", "ESPECES", "version", version);
        String url = "/api/caissier/commandes/" + commande + "/encaisser";

        List<Integer> statuts = enMemeTemps(List.of(
                () -> api.put(monde.jetonCaissier, url, corps).statut(),
                () -> api.put(autreCaissier, url, corps).statut()));

        assertThat(statuts).containsExactlyInAnyOrder(200, 409);
        assertThat(paiements(commande)).isEqualTo(1);
    }

    @Test
    void unCaissierNEncaisseQueLesCommandesDeSonRestaurant() {
        Reponse autreRestaurant = ok(api.post(monde.jetonAdmin, "/api/admin/restaurants",
                Monde.requeteRestaurant("Autre " + System.nanoTime())));
        String caissierAutre = monde.nouveauPersonnel(autreRestaurant.id(), Role.CAISSIER);
        ok(ouvrirCaisse(caissierAutre, 0));
        long commande = monde.commandePrete(monde.platId, 1);

        Reponse reponse = api.put(caissierAutre, "/api/caissier/commandes/" + commande + "/encaisser",
                Map.of("modePaiement", "ESPECES", "version", monde.version(commande)));

        assertThat(reponse.statut()).isEqualTo(403);
    }

    // Cloturer la caisse

    @Test
    void cloturerDonneLeMontantTheoriqueEtLEcart() {
        ok(ouvrirCaisse(monde.jetonCaissier, 10_000));
        ok(monde.encaisser(monde.commandePrete(monde.platId, 2), "ESPECES"));       // 4 000 en especes
        ok(monde.encaisser(monde.commandePrete(monde.platId, 1), "MOBILE_MONEY"));  // 2 000, hors caisse

        Reponse cloture = cloturer(monde.jetonCaissier, 13_500);

        assertThat(cloture.statut()).isEqualTo(200);
        assertThat(cloture.entier("$.montantTheorique")).isEqualTo(14_000);
        assertThat(cloture.entier("$.ecart")).isEqualTo(-500);
        assertThat(cloture.<String>lire("$.dateHeureCloture")).isNotNull();
        assertThat(cloturer(monde.jetonCaissier, 0).statut()).as("plus de caisse ouverte").isEqualTo(409);
    }

    @Test
    void chaqueCaissierTientSaPropreCaisse() {
        String autreCaissier = monde.nouveauPersonnel(monde.restaurantId, Role.CAISSIER);
        ok(ouvrirCaisse(monde.jetonCaissier, 1_000));
        ok(ouvrirCaisse(autreCaissier, 1_000));
        long commande = monde.commandePrete(monde.platId, 1);
        ok(api.put(autreCaissier, "/api/caissier/commandes/" + commande + "/encaisser",
                Map.of("modePaiement", "ESPECES", "version", monde.version(commande))));

        assertThat(cloturer(monde.jetonCaissier, 1_000).entier("$.ecart")).isZero();
        assertThat(cloturer(autreCaissier, 3_000).entier("$.montantTheorique")).isEqualTo(3_000);
    }

    @Test
    void leMontantCompteNePeutPasEtreNegatif() {
        ok(ouvrirCaisse(monde.jetonCaissier, 0));

        assertThat(cloturer(monde.jetonCaissier, -1).statut()).isEqualTo(400);
    }

    // Rapports financiers et statistiques

    @Test
    void lesRapportsFinanciersDonnentEncaissementsEcartsEtCommandesAbandonnees() {
        ok(ouvrirCaisse(monde.jetonCaissier, 10_000));
        ok(monde.encaisser(monde.commandePrete(monde.platId, 2), "ESPECES"));
        ok(monde.encaisser(monde.commandePrete(monde.boissonId, 2), "MOBILE_MONEY"));
        long abandonnee = monde.commandePrete(monde.platId, 1);
        ok(api.put(monde.jetonGerant, "/api/gerant/commandes/" + abandonnee + "/abandonner",
                Map.of("version", monde.version(abandonnee))));
        ok(cloturer(monde.jetonCaissier, 13_000));
        String aujourdHui = LocalDate.now().toString();

        Reponse rapport = ok(api.get(monde.jetonGerant,
                "/api/gerant/rapports-financiers?debut=" + aujourdHui + "&fin=" + aujourdHui));

        assertThat(rapport.liste("$.encaissementsParJour[*].jour")).containsExactly(aujourdHui);
        assertThat(rapport.entier("$.encaissementsParJour[0].montantEspeces")).isEqualTo(4_000);
        assertThat(rapport.entier("$.encaissementsParJour[0].montantMobileMoney")).isEqualTo(1_000);
        assertThat(rapport.liste("$.ecartsCaisse[*].ecart")).containsExactly(-1_000);
        assertThat(rapport.entier("$.montantCommandesAbandonnees")).isEqualTo(2_000);

        String hier = LocalDate.now().minusDays(1).toString();
        Reponse vide = ok(api.get(monde.jetonGerant, "/api/gerant/rapports-financiers?debut=" + hier + "&fin=" + hier));
        assertThat(vide.liste("$.encaissementsParJour")).isEmpty();
        assertThat(vide.entier("$.montantCommandesAbandonnees")).isZero();
    }

    @Test
    void lesStatistiquesNeComptentQueLesCommandesPayees() {
        ok(ouvrirCaisse(monde.jetonCaissier, 0));
        ok(monde.encaisser(monde.commandePrete(monde.platId, 2), "ESPECES"));          // 4 000
        long mixte = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id(); // 2 000 + 2 x 500
        ok(api.put(monde.jetonServeur, "/api/serveur/commandes/" + mixte, Map.of(
                "version", monde.version(mixte),
                "lignes", List.of(Map.of("platId", monde.platId, "quantite", 1),
                        Map.of("platId", monde.boissonId, "quantite", 2)))));
        ok(monde.demarrer(mixte));
        ok(monde.terminer(mixte));
        ok(monde.encaisser(mixte, "MOBILE_MONEY"));
        ok(monde.passerCommande(monde.jetonClient, monde.platId, 5)); // en attente : non comptee
        String aujourdHui = LocalDate.now().toString();

        Reponse stats = ok(api.get(monde.jetonGerant,
                "/api/gerant/statistiques-ventes?debut=" + aujourdHui + "&fin=" + aujourdHui));

        assertThat(stats.entier("$.nombreCommandesPayees")).isEqualTo(2);
        assertThat(stats.decimal("$.montantMoyen")).isEqualTo(3_500.0);
        assertThat(stats.liste("$.parPlat[?(@.platId == " + monde.platId + ")].quantiteVendue")).containsExactly(3);
        assertThat(stats.liste("$.parPlat[?(@.platId == " + monde.platId + ")].montant")).containsExactly(6_000);
        assertThat(stats.liste("$.parCategorie[?(@.categorie == 'BOISSON')].quantiteVendue")).containsExactly(2);
        assertThat(stats.liste("$.parCategorie[?(@.categorie == 'BOISSON')].montant")).containsExactly(1_000);
    }

    private int paiements(long commande) {
        return jdbc.queryForObject("select count(*) from paiement where commande_id = ?", Integer.class, commande);
    }

    private static List<Integer> enMemeTemps(List<Callable<Integer>> actions) throws Exception {
        CountDownLatch depart = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(actions.size());
        List<Future<Integer>> futures = new ArrayList<>();
        for (Callable<Integer> action : actions) {
            futures.add(pool.submit(() -> {
                depart.await();
                return action.call();
            }));
        }
        depart.countDown();
        List<Integer> statuts = new ArrayList<>();
        for (Future<Integer> future : futures) {
            statuts.add(future.get());
        }
        pool.shutdown();
        return statuts;
    }
}
