package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/**
 * Gerer la preparation (§4.3), Gerer les plats et les menus (§4.2), Gerer les
 * stocks, recommandations et rupture (§4.6), regles 10 a 12. Le plat du monde
 * de test consomme 0,5 kg de riz ; le stock initial est de 10 kg.
 */
class CuisineEtStocksTest extends IntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    // Preparation et stock

    @Test
    void demarrerLaPreparationDiminueLeStockSelonLaRecette() {
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 3)).id();

        Reponse demarree = ok(monde.demarrer(commande));

        assertThat(demarree.<String>lire("$.statut")).isEqualTo("EN_PREPARATION");
        assertThat(monde.stock(monde.rizId)).isCloseTo(Monde.STOCK_INITIAL_RIZ - 3 * Monde.RIZ_PAR_PLAT, within(1e-9));
        assertThat(ok(monde.terminer(commande)).<String>lire("$.statut")).isEqualTo("PRETE");
    }

    @Test
    void regle10LeStockPeutDevenirNegatifSansBloquerLesCommandes() {
        // 10 kg de riz, 0,5 kg par plat : 30 plats demandent 15 kg.
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 30)).id();

        assertThat(monde.demarrer(commande).statut()).isEqualTo(200);
        assertThat(monde.stock(monde.rizId)).isCloseTo(-5.0, within(1e-9));
        Reponse ingredients = api.get(monde.jetonGerant, "/api/gerant/ingredients");
        assertThat(ingredients.liste("$[?(@.id == " + monde.rizId + ")].alerte")).containsExactly(true);
    }

    @Test
    void lOrdreDesStatutsEstRespecte() {
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();

        assertThat(monde.terminer(commande).statut()).as("terminer avant de demarrer").isEqualTo(409);
        ok(monde.demarrer(commande));
        assertThat(monde.demarrer(commande).statut()).as("demarrer deux fois").isEqualTo(409);
    }

    @Test
    void leCuisinierVoitLesCommandesEnAttenteOuEnPreparationParOrdreDArrivee() {
        long premiere = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        long seconde = ok(monde.passerCommande(monde.jetonClient, monde.platId, 1)).id();
        long prete = monde.commandePrete(monde.platId, 1);
        ok(monde.demarrer(seconde));

        List<Object> ids = api.get(monde.jetonCuisinier, "/api/cuisine/commandes").liste("$[*].id");

        assertThat(ids).containsExactly((int) premiere, (int) seconde).doesNotContain((int) prete);
    }

    @Test
    void deuxCuisiniersQuiDemarrentEnMemeTempsNeDiminuentLeStockQuUneFois() throws Exception {
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 2)).id();
        long version = monde.version(commande);
        String autreCuisinier = monde.nouveauPersonnel(monde.restaurantId, com.saes.backend.domain.Role.CUISINIER);
        CountDownLatch depart = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Integer>> resultats = new ArrayList<>();
        for (String jeton : List.of(monde.jetonCuisinier, autreCuisinier)) {
            resultats.add(pool.submit(() -> {
                depart.await();
                return api.put(jeton, "/api/cuisine/commandes/" + commande + "/demarrer", Map.of("version", version))
                        .statut();
            }));
        }
        depart.countDown();
        List<Integer> statuts = List.of(resultats.get(0).get(), resultats.get(1).get());
        pool.shutdown();

        // Qualite attendue §6.3 : l'action perdante est annulee en entier, stock compris.
        assertThat(statuts).containsExactlyInAnyOrder(200, 409);
        assertThat(monde.stock(monde.rizId)).isCloseTo(Monde.STOCK_INITIAL_RIZ - 2 * Monde.RIZ_PAR_PLAT, within(1e-9));
        Integer sorties = jdbc.queryForObject(
                "select count(*) from mouvement_stock where ingredient_id = ? and type = 'SORTIE'",
                Integer.class, monde.rizId);
        assertThat(sorties).isEqualTo(1);
    }

    // Gerer les stocks

    @Test
    void leStockEstLeTotalDesEntreesMoinsLeTotalDesSorties() {
        ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "ENTREE", "quantite", 2.5)));
        Reponse apresSortie = ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "SORTIE", "quantite", 4)));

        assertThat(apresSortie.decimal("$.stock")).isCloseTo(Monde.STOCK_INITIAL_RIZ + 2.5 - 4, within(1e-9));
    }

    @Test
    void unIngredientAuSeuilDAlerteOuEnDessousEstSignale() {
        Reponse auDessus = ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "SORTIE", "quantite", 8.9)));
        assertThat(auDessus.<Boolean>lire("$.alerte")).isFalse();

        Reponse auSeuil = ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "SORTIE", "quantite", 0.1)));
        assertThat(auSeuil.decimal("$.stock")).isCloseTo(1.0, within(1e-9));
        assertThat(auSeuil.<Boolean>lire("$.alerte")).isTrue();
    }

    @Test
    void regle18LeNiveauCibleNEstPasInferieurAuSeuilDAlerte() {
        Reponse reponse = api.post(monde.jetonGerant, "/api/gerant/ingredients",
                Map.of("nom", "Oignon", "unite", "KILOGRAMME", "seuilAlerte", 5, "niveauCible", 2));

        assertThat(reponse.statut()).isEqualTo(400);
    }

    // Recommandations

    @Test
    void regle11LaQuantiteARecommanderEstLeNiveauCibleMoinsLeStockPositif() {
        // Riz : cible 20, stock 10 -> 10. Bissap : cible 2000, stock 1000 -> 1000.
        Reponse recommandations = ok(api.get(monde.jetonGerant, "/api/gerant/recommandations"));
        assertThat(recommandations.liste("$[?(@.ingredientId == " + monde.rizId + ")].quantiteARecommander"))
                .containsExactly(10.0);

        // Stock negatif : il compte pour zero, la quantite est donc le niveau cible.
        ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "SORTIE", "quantite", 13)));
        recommandations = ok(api.get(monde.jetonGerant, "/api/gerant/recommandations"));
        assertThat(recommandations.liste("$[?(@.ingredientId == " + monde.rizId + ")].quantiteARecommander"))
                .containsExactly(20.0);
    }

    @Test
    void regle11UnIngredientAuNiveauCibleNEstPasRecommande() {
        ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "ENTREE", "quantite", 10)));

        Reponse recommandations = ok(api.get(monde.jetonGerant, "/api/gerant/recommandations"));

        assertThat(recommandations.liste("$[*].ingredientId")).doesNotContain((int) monde.rizId);
    }

    @Test
    void laConsommationMoyenneParSemaineEstCalculeeSurLes28DerniersJours() {
        long commande = ok(monde.passerCommande(monde.jetonClient, monde.platId, 8)).id();
        ok(monde.demarrer(commande)); // 4 kg sortis aujourd'hui -> 4 / 4 semaines = 1 kg par semaine

        Reponse recommandations = ok(api.get(monde.jetonGerant, "/api/gerant/recommandations"));

        assertThat(recommandations.liste("$[?(@.ingredientId == " + monde.rizId + ")].consommationMoyenneParSemaine"))
                .containsExactly(1.0);
    }

    // Signaler une rupture

    @Test
    void signalerUneRuptureDesactiveLesPlatsConcernesEtRameneLeStockAZero() {
        Reponse reponse = api.post(monde.jetonCuisinier, "/api/cuisine/ingredients/" + monde.rizId + "/signaler-rupture", null);

        assertThat(reponse.statut()).isEqualTo(204);
        assertThat(monde.stock(monde.rizId)).isZero();
        Reponse plats = api.get(monde.jetonGerant, "/api/gerant/plats");
        assertThat(plats.liste("$[?(@.id == " + monde.platId + ")].estActif")).containsExactly(false);
        assertThat(plats.liste("$[?(@.id == " + monde.boissonId + ")].estActif")).containsExactly(true);
        assertThat(monde.passerCommande(monde.jetonClient, monde.platId, 1).statut()).isEqualTo(409);

        // Le gerant reactive le plat apres reapprovisionnement.
        ok(api.put(monde.jetonGerant, "/api/gerant/plats/" + monde.platId + "/activer", null));
        assertThat(monde.passerCommande(monde.jetonClient, monde.platId, 1).statut()).isEqualTo(201);
    }

    @Test
    void uneRuptureNeModifiePasUnStockDejaNulOuNegatif() {
        ok(api.post(monde.jetonGerant, "/api/gerant/ingredients/" + monde.rizId + "/mouvements",
                Map.of("type", "SORTIE", "quantite", 12)));

        ok(api.post(monde.jetonCuisinier, "/api/cuisine/ingredients/" + monde.rizId + "/signaler-rupture", null));

        assertThat(monde.stock(monde.rizId)).isCloseTo(-2.0, within(1e-9));
    }

    // Gerer les plats et les menus

    @Test
    void modifierUnPlatMetAJourSaRecetteEtSonPrix() {
        Reponse modifie = api.put(monde.jetonGerant, "/api/gerant/plats/" + monde.platId, Map.of(
                "nom", "Thieboudienne", "prix", 2500, "categorie", "PLAT_PRINCIPAL",
                "recette", List.of(
                        Map.of("ingredientId", monde.rizId, "quantiteNecessaire", 0.4),
                        Map.of("ingredientId", monde.bissapId, "quantiteNecessaire", 10))));

        assertThat(modifie.statut()).as(modifie.toString()).isEqualTo(200);
        assertThat(modifie.entier("$.prix")).isEqualTo(2500);
        assertThat(modifie.liste("$.recette[?(@.ingredientId == " + monde.rizId + ")].quantiteNecessaire"))
                .containsExactly(0.4);
        assertThat(modifie.liste("$.recette[*].ingredientId")).hasSize(2);

        Reponse reduit = ok(api.put(monde.jetonGerant, "/api/gerant/plats/" + monde.platId, Map.of(
                "nom", "Thieboudienne", "prix", 2500, "categorie", "PLAT_PRINCIPAL",
                "recette", List.of(Map.of("ingredientId", monde.bissapId, "quantiteNecessaire", 10)))));
        assertThat(reduit.liste("$.recette[*].ingredientId")).containsExactly((int) monde.bissapId);
    }

    @Test
    void unPlatSansIngredientOuAvecUnIngredientEnDoubleEstRefuse() {
        Map<String, Object> sansRecette = Map.of("nom", "Vide", "prix", 1000, "categorie", "DESSERT", "recette", List.of());
        Map<String, Object> doublon = Map.of("nom", "Double", "prix", 1000, "categorie", "DESSERT", "recette", List.of(
                Map.of("ingredientId", monde.rizId, "quantiteNecessaire", 1),
                Map.of("ingredientId", monde.rizId, "quantiteNecessaire", 2)));

        assertThat(api.post(monde.jetonGerant, "/api/gerant/plats", sansRecette).statut()).isEqualTo(400);
        assertThat(api.post(monde.jetonGerant, "/api/gerant/plats", doublon).statut()).isEqualTo(400);
    }

    @Test
    void unPlatGratuitEstRefuse() {
        Reponse gratuit = api.post(monde.jetonGerant, "/api/gerant/plats", Map.of(
                "nom", "Gratuit", "prix", 0, "categorie", "DESSERT",
                "recette", List.of(Map.of("ingredientId", monde.rizId, "quantiteNecessaire", 1))));

        assertThat(gratuit.statut()).as(gratuit.toString()).isEqualTo(400);
    }

    @Test
    void unMenuAUneDateDeFinQuiNEstPasAvantSaDateDeDebutEtAuMoinsUnPlat() {
        String aujourdHui = LocalDate.now().toString();
        String hier = LocalDate.now().minusDays(1).toString();

        assertThat(api.post(monde.jetonGerant, "/api/gerant/menus", Map.of(
                "nom", "Menu", "dateDebut", aujourdHui, "dateFin", hier, "platIds", List.of(monde.platId)))
                .statut()).isEqualTo(400);
        assertThat(api.post(monde.jetonGerant, "/api/gerant/menus", Map.of(
                "nom", "Menu", "dateDebut", aujourdHui, "platIds", List.of())).statut()).isEqualTo(400);
    }

    @Test
    void consulterLesMenusNeMontreQueLesPlatsActifsDesMenusEnVigueur() {
        ok(api.put(monde.jetonGerant, "/api/gerant/plats/" + monde.boissonId + "/desactiver", null));
        ok(api.post(monde.jetonGerant, "/api/gerant/menus", Map.of(
                "nom", "Menu de demain", "dateDebut", LocalDate.now().plusDays(1).toString(),
                "platIds", List.of(monde.platId))));

        Reponse menus = ok(api.get(null, "/api/public/restaurants/" + monde.restaurantId + "/menus"));

        assertThat(menus.liste("$[*].nom")).containsExactly("Menu du jour");
        assertThat(menus.liste("$[0].plats[*].id")).containsExactly((int) monde.platId);
    }
}
