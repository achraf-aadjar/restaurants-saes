package com.saes.backend.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.support.Api.Reponse;

/**
 * Un restaurant complet, cree par l'API comme le feraient l'administrateur et
 * le gerant : 3 tables (capacites 2, 4 et 6), ouvert tous les jours de 00:00 a
 * 23:59:59, un compte par role du personnel, deux ingredients, deux plats et un
 * menu en vigueur. Chaque test recoit le sien : les tests ne partagent rien.
 */
public final class Monde {

    public static final String MOT_DE_PASSE = "motdepasse123";
    public static final int PRIX_PLAT = 2000;
    public static final int PRIX_BOISSON = 500;
    public static final double RIZ_PAR_PLAT = 0.5;
    public static final double STOCK_INITIAL_RIZ = 10;

    private static final AtomicInteger COMPTEUR = new AtomicInteger();

    private final Api api;
    private final CommandeRepository commandeRepository;
    private final String suffixe;

    public final String jetonAdmin;
    public long restaurantId;
    public final Map<Integer, Long> tables = new HashMap<>();
    public String jetonGerant;
    public String jetonServeur;
    public String jetonCuisinier;
    public String jetonCaissier;
    public String jetonClient;
    public long rizId;
    public long bissapId;
    public long platId;
    public long boissonId;
    public long menuId;

    private Monde(Api api, String jetonAdmin, CommandeRepository commandeRepository, String suffixe) {
        this.api = api;
        this.jetonAdmin = jetonAdmin;
        this.commandeRepository = commandeRepository;
        this.suffixe = suffixe;
    }

    public static Monde creer(
            Api api, UtilisateurRepository utilisateurs, PasswordEncoder encodeur, CommandeRepository commandes) {
        String suffixe = System.nanoTime() + "-" + COMPTEUR.incrementAndGet();

        Utilisateur admin = new Utilisateur();
        admin.setNom("Admin");
        admin.setPrenom("Test");
        admin.setEmail("admin-" + suffixe + "@test.sn");
        admin.setMotDePasse(encodeur.encode(MOT_DE_PASSE));
        admin.setRoles(EnumSet.of(Role.ADMINISTRATEUR));
        admin.setEstActif(true);
        utilisateurs.save(admin);

        Monde monde = new Monde(api, connecter(api, admin.getEmail()), commandes, suffixe);
        monde.construire();
        return monde;
    }

    private void construire() {
        Reponse restaurant = ok(api.post(jetonAdmin, "/api/admin/restaurants", requeteRestaurant("Restaurant " + suffixe)));
        restaurantId = restaurant.id();
        for (Object table : restaurant.liste("$.tables")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> t = (Map<String, Object>) table;
            tables.put(((Number) t.get("numero")).intValue(), ((Number) t.get("id")).longValue());
        }

        jetonGerant = nouveauPersonnel(restaurantId, Role.GERANT);
        jetonServeur = nouveauPersonnel(restaurantId, Role.SERVEUR);
        jetonCuisinier = nouveauPersonnel(restaurantId, Role.CUISINIER);
        jetonCaissier = nouveauPersonnel(restaurantId, Role.CAISSIER);
        jetonClient = nouveauClient();

        rizId = ok(api.post(jetonGerant, "/api/gerant/ingredients",
                Map.of("nom", "Riz", "unite", "KILOGRAMME", "seuilAlerte", 1, "niveauCible", 20))).id();
        ok(api.post(jetonGerant, "/api/gerant/ingredients/" + rizId + "/mouvements",
                Map.of("type", "ENTREE", "quantite", STOCK_INITIAL_RIZ)));
        bissapId = ok(api.post(jetonGerant, "/api/gerant/ingredients",
                Map.of("nom", "Bissap", "unite", "GRAMME", "seuilAlerte", 100, "niveauCible", 2000))).id();
        ok(api.post(jetonGerant, "/api/gerant/ingredients/" + bissapId + "/mouvements",
                Map.of("type", "ENTREE", "quantite", 1000)));

        platId = creerPlat("Thieboudienne", PRIX_PLAT, "PLAT_PRINCIPAL", rizId, RIZ_PAR_PLAT);
        boissonId = creerPlat("Jus de bissap", PRIX_BOISSON, "BOISSON", bissapId, 30);
        menuId = ok(api.post(jetonGerant, "/api/gerant/menus", Map.of(
                "nom", "Menu du jour",
                "dateDebut", LocalDate.now().toString(),
                "platIds", List.of(platId, boissonId)))).id();
    }

    public long creerPlat(String nom, int prix, String categorie, long ingredientId, double quantite) {
        return ok(api.post(jetonGerant, "/api/gerant/plats", Map.of(
                "nom", nom,
                "prix", prix,
                "categorie", categorie,
                "recette", List.of(Map.of("ingredientId", ingredientId, "quantiteNecessaire", quantite))))).id();
    }

    /** Requete de creation/modification d'un restaurant ouvert tous les jours, 00:00 - 23:59:59. */
    public static Map<String, Object> requeteRestaurant(String nom) {
        List<Map<String, Object>> horaires = new ArrayList<>();
        for (String jour : List.of("LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE")) {
            horaires.add(Map.of("jour", jour, "heureOuverture", "00:00:00", "heureFermeture", "23:59:59"));
        }
        Map<String, Object> requete = new HashMap<>();
        requete.put("nom", nom);
        requete.put("adresse", "Ecole Polytechnique de Thies");
        requete.put("telephone", "+221 33 000 00 00");
        requete.put("dureeReservationMinutes", 90);
        requete.put("tables", List.of(
                Map.of("numero", 1, "capacite", 2),
                Map.of("numero", 2, "capacite", 4),
                Map.of("numero", 3, "capacite", 6)));
        requete.put("horaires", horaires);
        return requete;
    }

    public String nouveauClient() {
        String email = "client-" + suffixe + "-" + COMPTEUR.incrementAndGet() + "@test.sn";
        Reponse inscription = api.post(null, "/api/auth/register", Map.of(
                "nom", "Diop", "prenom", "Awa", "email", email, "motDePasse", MOT_DE_PASSE));
        assertThat(inscription.statut()).as(inscription.toString()).isEqualTo(201);
        return inscription.lire("$.token");
    }

    public String nouveauPersonnel(long restaurant, Role... roles) {
        String email = "personnel-" + suffixe + "-" + COMPTEUR.incrementAndGet() + "@test.sn";
        ok(api.post(jetonAdmin, "/api/admin/users", Map.of(
                "nom", "Ndiaye", "prenom", "Moussa", "email", email, "motDePasse", MOT_DE_PASSE,
                "restaurantId", restaurant, "roles", List.of(roles))));
        return connecter(api, email);
    }

    public static String connecter(Api api, String email) {
        Reponse connexion = api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", MOT_DE_PASSE));
        assertThat(connexion.statut()).as(connexion.toString()).isEqualTo(200);
        return connexion.lire("$.token");
    }

    // Commandes

    public Reponse passerCommande(String jetonClient, long plat, int quantite) {
        return api.post(jetonClient, "/api/commandes", Map.of(
                "restaurantId", restaurantId,
                "lignes", List.of(Map.of("platId", plat, "quantite", quantite))));
    }

    /** Version enregistree en base, relue hors de toute transaction de l'API. */
    public long version(long commandeId) {
        return commandeRepository.findById(commandeId).orElseThrow().getVersion();
    }

    public Reponse demarrer(long commandeId) {
        return api.put(jetonCuisinier, "/api/cuisine/commandes/" + commandeId + "/demarrer",
                Map.of("version", version(commandeId)));
    }

    public Reponse terminer(long commandeId) {
        return api.put(jetonCuisinier, "/api/cuisine/commandes/" + commandeId + "/terminer",
                Map.of("version", version(commandeId)));
    }

    /** Commande client de {@code quantite} plats, preparee puis prete a encaisser. */
    public long commandePrete(long plat, int quantite) {
        long id = ok(passerCommande(jetonClient, plat, quantite)).id();
        ok(demarrer(id));
        ok(terminer(id));
        return id;
    }

    public Reponse encaisser(long commandeId, String modePaiement) {
        return api.put(jetonCaissier, "/api/caissier/commandes/" + commandeId + "/encaisser",
                Map.of("modePaiement", modePaiement, "version", version(commandeId)));
    }

    // Stocks

    public double stock(long ingredientId) {
        Reponse ingredients = ok(api.get(jetonGerant, "/api/gerant/ingredients"));
        List<Object> stocks = ingredients.liste("$[?(@.id == " + ingredientId + ")].stock");
        return ((Number) stocks.getFirst()).doubleValue();
    }

    public static Reponse ok(Reponse reponse) {
        assertThat(reponse.statut()).as(reponse.toString()).isBetween(200, 299);
        return reponse;
    }
}
