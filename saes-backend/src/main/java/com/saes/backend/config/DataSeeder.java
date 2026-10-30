package com.saes.backend.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.CategoriePlat;
import com.saes.backend.domain.Commande;
import com.saes.backend.domain.HoraireOuverture;
import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.JourSemaine;
import com.saes.backend.domain.LigneCommande;
import com.saes.backend.domain.Menu;
import com.saes.backend.domain.ModePaiement;
import com.saes.backend.domain.MouvementStock;
import com.saes.backend.domain.Paiement;
import com.saes.backend.domain.Plat;
import com.saes.backend.domain.Recette;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.SessionCaisse;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.TableRestaurant;
import com.saes.backend.domain.TypeCommande;
import com.saes.backend.domain.TypeMouvement;
import com.saes.backend.domain.Unite;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.MenuRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.repository.PaiementRepository;
import com.saes.backend.repository.PlatRepository;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.SessionCaisseRepository;
import com.saes.backend.repository.UtilisateurRepository;

/**
 * Jeu de donnees de test decrit dans organisation_travail_sujet17.pdf (§7,
 * mise en place) : un restaurant avec ses tables et ses horaires, un compte
 * par role, des ingredients avec du stock, des plats avec leur recette, des
 * menus, et des commandes dans chaque statut. N'est insere que si la base
 * est vide. Actif uniquement avec le profil "dev".
 */
@Configuration
@Profile("dev")
public class DataSeeder {

    private static final String MOT_DE_PASSE = "password123";

    @Bean
    @Transactional
    CommandLineRunner seed(
            RestaurantRepository restaurantRepository,
            UtilisateurRepository utilisateurRepository,
            IngredientRepository ingredientRepository,
            MouvementStockRepository mouvementStockRepository,
            PlatRepository platRepository,
            MenuRepository menuRepository,
            CommandeRepository commandeRepository,
            SessionCaisseRepository sessionCaisseRepository,
            PaiementRepository paiementRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (restaurantRepository.count() > 0) {
                return;
            }

            Restaurant restaurant = new Restaurant();
            restaurant.setNom("Restaurant de l'EPT");
            restaurant.setAdresse("Ecole Polytechnique de Thies, Thies, Senegal");
            restaurant.setTelephone("+221 33 951 00 00");
            restaurant.setDureeReservationMinutes(90);
            restaurant.setEstActif(true);

            for (int numero = 1; numero <= 6; numero++) {
                TableRestaurant table = new TableRestaurant();
                table.setRestaurant(restaurant);
                table.setNumero(numero);
                table.setCapacite(numero <= 3 ? 2 : 4);
                restaurant.getTables().add(table);
            }

            for (JourSemaine jour : List.of(
                    JourSemaine.LUNDI, JourSemaine.MARDI, JourSemaine.MERCREDI,
                    JourSemaine.JEUDI, JourSemaine.VENDREDI)) {
                HoraireOuverture horaire = new HoraireOuverture();
                horaire.setRestaurant(restaurant);
                horaire.setJour(jour);
                horaire.setHeureOuverture(LocalTime.of(8, 0));
                horaire.setHeureFermeture(LocalTime.of(21, 0));
                restaurant.getHoraires().add(horaire);
            }
            restaurant = restaurantRepository.save(restaurant);

            Utilisateur admin = utilisateur("Seck", "Awa", "admin@saes.sn", passwordEncoder, null, Role.ADMINISTRATEUR);
            Utilisateur gerant = utilisateur("Faye", "Khadim", "gerant@saes.sn", passwordEncoder, restaurant, Role.GERANT);
            Utilisateur caissier = utilisateur("Diop", "Mariama", "caissier@saes.sn", passwordEncoder, restaurant, Role.CAISSIER);
            Utilisateur cuisinier = utilisateur("Ndiaye", "Fallou", "cuisinier@saes.sn", passwordEncoder, restaurant, Role.CUISINIER);
            Utilisateur serveur = utilisateur("Ba", "Omar", "serveur@saes.sn", passwordEncoder, restaurant, Role.SERVEUR);
            Utilisateur client = utilisateur("Aadjar", "Achraf", "client@saes.sn", passwordEncoder, null, Role.CLIENT);
            for (Utilisateur u : List.of(admin, gerant, caissier, cuisinier, serveur, client)) {
                utilisateurRepository.save(u);
            }

            Map<String, Ingredient> ingredients = Map.of(
                    "Riz", ingredient(restaurant, "Riz", Unite.KILOGRAMME, 5, 30),
                    "Poisson", ingredient(restaurant, "Poisson", Unite.KILOGRAMME, 3, 20),
                    "Poulet", ingredient(restaurant, "Poulet", Unite.KILOGRAMME, 3, 20),
                    "Legumes", ingredient(restaurant, "Legumes", Unite.KILOGRAMME, 4, 25),
                    "Mil", ingredient(restaurant, "Mil", Unite.KILOGRAMME, 2, 10),
                    "Bissap", ingredient(restaurant, "Fleurs de bissap", Unite.GRAMME, 200, 2000),
                    "Bouye", ingredient(restaurant, "Pulpe de bouye", Unite.GRAMME, 200, 2000));
            for (Ingredient ingredient : ingredients.values()) {
                ingredientRepository.save(ingredient);
                MouvementStock entree = new MouvementStock();
                entree.setIngredient(ingredient);
                entree.setType(TypeMouvement.ENTREE);
                entree.setQuantite(ingredient.getNiveauCible());
                entree.setDateHeure(Instant.now());
                mouvementStockRepository.save(entree);
            }

            Plat thieboudienne = plat(restaurant, "Thieboudienne", "Riz au poisson, legumes et sauce tomate",
                    2500, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ingredients.get("Riz"), new BigDecimal("0.300")),
                    recette(ingredients.get("Poisson"), new BigDecimal("0.250")),
                    recette(ingredients.get("Legumes"), new BigDecimal("0.200")));
            Plat yassaPoulet = plat(restaurant, "Yassa poulet", "Poulet mariné aux oignons et citron",
                    2000, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ingredients.get("Poulet"), new BigDecimal("0.300")),
                    recette(ingredients.get("Riz"), new BigDecimal("0.250")));
            Plat mafe = plat(restaurant, "Mafé", "Viande et legumes dans une sauce a l'arachide",
                    2000, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ingredients.get("Poulet"), new BigDecimal("0.250")),
                    recette(ingredients.get("Riz"), new BigDecimal("0.250")));
            Plat thiakry = plat(restaurant, "Thiakry", "Couscous de mil au lait caille et au sucre",
                    700, CategoriePlat.DESSERT,
                    recette(ingredients.get("Mil"), new BigDecimal("0.150")));
            Plat jusDeBissap = plat(restaurant, "Jus de bissap", "Boisson rafraichissante a l'hibiscus",
                    500, CategoriePlat.BOISSON,
                    recette(ingredients.get("Bissap"), new BigDecimal("30")));
            Plat jusDeBouye = plat(restaurant, "Jus de bouye", "Boisson a la pulpe de fruit du baobab",
                    500, CategoriePlat.BOISSON,
                    recette(ingredients.get("Bouye"), new BigDecimal("30")));
            for (Plat p : List.of(thieboudienne, yassaPoulet, mafe, thiakry, jusDeBissap, jusDeBouye)) {
                platRepository.save(p);
            }

            Menu menu = new Menu();
            menu.setRestaurant(restaurant);
            menu.setNom("Menu de la semaine");
            menu.setDateDebut(LocalDate.now().minusDays(7));
            menu.setDateFin(null);
            menu.getPlats().addAll(List.of(thieboudienne, yassaPoulet, mafe, thiakry, jusDeBissap, jusDeBouye));
            menuRepository.save(menu);

            SessionCaisse session = new SessionCaisse();
            session.setCaissier(caissier);
            session.setDateHeureOuverture(Instant.now());
            session.setFondDeCaisse(20000);
            session = sessionCaisseRepository.save(session);

            commandeRepository.save(commande(restaurant, client, null, null,
                    TypeCommande.A_EMPORTER, StatutCommande.EN_ATTENTE, thieboudienne, 1));
            commandeRepository.save(commande(restaurant, null, serveur, restaurant.getTables().get(0),
                    TypeCommande.SUR_PLACE, StatutCommande.EN_PREPARATION, yassaPoulet, 2));
            commandeRepository.save(commande(restaurant, null, serveur, restaurant.getTables().get(1),
                    TypeCommande.SUR_PLACE, StatutCommande.PRETE, mafe, 1));
            Commande payee = commandeRepository.save(commande(restaurant, client, null, null,
                    TypeCommande.A_EMPORTER, StatutCommande.PAYEE, thiakry, 2));
            commandeRepository.save(commande(restaurant, client, null, null,
                    TypeCommande.A_EMPORTER, StatutCommande.ANNULEE, jusDeBissap, 1));
            commandeRepository.save(commande(restaurant, null, serveur, restaurant.getTables().get(2),
                    TypeCommande.SUR_PLACE, StatutCommande.ABANDONNEE, jusDeBouye, 3));

            Paiement paiement = new Paiement();
            paiement.setCommande(payee);
            paiement.setSessionCaisse(session);
            paiement.setModePaiement(ModePaiement.ESPECES);
            paiement.setDateHeure(Instant.now());
            paiementRepository.save(paiement);
        };
    }

    private static Utilisateur utilisateur(
            String nom, String prenom, String email, PasswordEncoder encoder, Restaurant restaurant, Role role) {
        Utilisateur u = new Utilisateur();
        u.setNom(nom);
        u.setPrenom(prenom);
        u.setEmail(email);
        u.setMotDePasse(encoder.encode(MOT_DE_PASSE));
        u.setRestaurant(restaurant);
        u.setEstActif(true);
        u.setRoles(EnumSet.of(role));
        return u;
    }

    private static Ingredient ingredient(
            Restaurant restaurant, String nom, Unite unite, double seuilAlerte, double niveauCible) {
        Ingredient i = new Ingredient();
        i.setRestaurant(restaurant);
        i.setNom(nom);
        i.setUnite(unite);
        i.setSeuilAlerte(BigDecimal.valueOf(seuilAlerte));
        i.setNiveauCible(BigDecimal.valueOf(niveauCible));
        return i;
    }

    private static Recette recette(Ingredient ingredient, BigDecimal quantite) {
        Recette r = new Recette();
        r.setIngredient(ingredient);
        r.setQuantiteNecessaire(quantite);
        return r;
    }

    private static Plat plat(
            Restaurant restaurant, String nom, String description, int prix, CategoriePlat categorie,
            Recette... ingredients) {
        Plat plat = new Plat();
        plat.setRestaurant(restaurant);
        plat.setNom(nom);
        plat.setDescription(description);
        plat.setPrix(prix);
        plat.setCategorie(categorie);
        plat.setEstActif(true);
        for (Recette r : ingredients) {
            r.setPlat(plat);
            plat.getRecette().add(r);
        }
        return plat;
    }

    private static Commande commande(
            Restaurant restaurant, Utilisateur client, Utilisateur serveur, TableRestaurant table,
            TypeCommande type, StatutCommande statut, Plat plat, int quantite) {
        Commande c = new Commande();
        c.setRestaurant(restaurant);
        c.setClient(client);
        c.setServeur(serveur);
        c.setTable(table);
        c.setType(type);
        c.setStatut(statut);
        c.setDateHeure(Instant.now());

        LigneCommande ligne = new LigneCommande();
        ligne.setCommande(c);
        ligne.setPlat(plat);
        ligne.setQuantite(quantite);
        ligne.setPrixUnitaire(plat.getPrix());
        c.getLignes().add(ligne);
        return c;
    }
}
