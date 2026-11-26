package com.saes.backend.config;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.CategoriePlat;
import com.saes.backend.domain.Commande;
import com.saes.backend.domain.HoraireOuverture;
import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.JourSemaine;
import com.saes.backend.domain.JournalOperation;
import com.saes.backend.domain.LigneCommande;
import com.saes.backend.domain.Menu;
import com.saes.backend.domain.ModePaiement;
import com.saes.backend.domain.MouvementStock;
import com.saes.backend.domain.Paiement;
import com.saes.backend.domain.Plat;
import com.saes.backend.domain.Recette;
import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.ReservationTable;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.SessionCaisse;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.domain.TableRestaurant;
import com.saes.backend.domain.TypeCommande;
import com.saes.backend.domain.TypeMouvement;
import com.saes.backend.domain.Unite;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.JournalOperationRepository;
import com.saes.backend.repository.MenuRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.repository.PaiementRepository;
import com.saes.backend.repository.PlatRepository;
import com.saes.backend.repository.ReservationRepository;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.SessionCaisseRepository;
import com.saes.backend.repository.UtilisateurRepository;

/**
 * Jeu de donnees de demonstration (organisation_travail_sujet17.pdf, §7).
 *
 * <p>Il n'est insere que si la base est vide, et seulement avec le profil
 * "dev" : la production n'en recoit jamais rien. Le tirage aleatoire part
 * d'une graine fixe, donc deux installations obtiennent exactement le meme jeu.
 *
 * <p>Ce qu'il contient : le restaurant de l'EPT avec ses tables et ses horaires,
 * un compte par role plus du personnel et des clients, des ingredients et leurs
 * mouvements de stock, des plats avec leur recette, des menus, dix semaines de
 * commandes payees avec leurs paiements et leurs sessions de caisse, des
 * reservations passees et a venir, et des entrees de journal.
 *
 * <p>Un seul restaurant est cree : c'est a l'administrateur d'en ajouter
 * d'autres depuis son ecran, comme le prevoit le cahier des charges (§4.7).
 *
 * <p>Toutes les regles du cahier des charges sont respectees : le prix d'une
 * ligne est celui du plat au moment ou elle est creee (regle 4), le stock est
 * la somme des entrees moins celle des sorties (regle 10), deux reservations
 * confirmees ne partagent jamais une table sur des creneaux qui se chevauchent
 * (regle 8), et les plats, tables et ingredients d'un restaurant lui
 * appartiennent (regle 15).
 */
@Configuration
@Profile("dev")
public class DataSeeder {

    private static final String MOT_DE_PASSE = "password123";

    /** Graine fixe : le jeu de donnees est le meme sur toutes les installations. */
    private static final long GRAINE = 17L;

    /** Profondeur de l'historique, en jours : de quoi remplir rapports et statistiques. */
    private static final int JOURS_HISTORIQUE = 70;

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final Random alea = new Random(GRAINE);

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
            ReservationRepository reservationRepository,
            JournalOperationRepository journalOperationRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (restaurantRepository.count() > 0) {
                return;
            }

            // ----- Restaurants -------------------------------------------------
            Restaurant ept = restaurantRepository.save(restaurant(
                    "Restaurant de l'EPT",
                    "École polytechnique de Thiès, Thiès, Sénégal",
                    "+221 33 951 00 00", 90,
                    new int[][] {{1, 2}, {2, 2}, {3, 2}, {4, 4}, {5, 4}, {6, 4}, {7, 6}, {8, 6}, {9, 8}},
                    LocalTime.of(8, 0), LocalTime.of(21, 0), false));

            // ----- Comptes -----------------------------------------------------
            // Les six comptes de la documentation gardent leur adresse et leur role.
            Utilisateur admin = utilisateur("Seck", "Awa", "admin@saes.sn", passwordEncoder, null, Role.ADMINISTRATEUR);
            Utilisateur gerant = utilisateur("Faye", "Khadim", "gerant@saes.sn", passwordEncoder, ept, Role.GERANT);
            Utilisateur caissier = utilisateur("Diop", "Mariama", "caissier@saes.sn", passwordEncoder, ept, Role.CAISSIER);
            Utilisateur cuisinier = utilisateur("Ndiaye", "Fallou", "cuisinier@saes.sn", passwordEncoder, ept, Role.CUISINIER);
            Utilisateur serveur = utilisateur("Ba", "Omar", "serveur@saes.sn", passwordEncoder, ept, Role.SERVEUR);
            Utilisateur client = utilisateur("Aadjar", "Achraf", "client@saes.sn", passwordEncoder, null, Role.CLIENT);

            List<Utilisateur> comptes = new ArrayList<>(List.of(
                    admin, gerant, caissier, cuisinier, serveur, client,
                    utilisateur("Sow", "Aminata", "a.sow@saes.sn", passwordEncoder, ept, Role.SERVEUR),
                    utilisateur("Gueye", "Moussa", "m.gueye@saes.sn", passwordEncoder, ept, Role.CUISINIER),
                    utilisateur("Cissé", "Ndeye", "n.cisse@saes.sn", passwordEncoder, ept, Role.CAISSIER)));

            // Un compte qui porte deux roles : un seul compte suffit (cahier §3).
            Utilisateur gerantCaissier = utilisateur(
                    "Mbaye", "Sokhna", "s.mbaye@saes.sn", passwordEncoder, ept, Role.GERANT);
            gerantCaissier.setRoles(EnumSet.of(Role.GERANT, Role.CAISSIER));
            comptes.add(gerantCaissier);

            // Un compte desactive, pour montrer l'ecran d'administration.
            Utilisateur ancien = utilisateur(
                    "Kane", "Babacar", "b.kane@saes.sn", passwordEncoder, ept, Role.SERVEUR);
            ancien.setEstActif(false);
            comptes.add(ancien);

            String[][] clients = {
                    {"Ndoye", "Seynabou"}, {"Fall", "Modou"}, {"Diouf", "Awa"}, {"Sy", "Mamadou"},
                    {"Camara", "Bineta"}, {"Sène", "Ousmane"}, {"Bâ", "Rokhaya"}, {"Niang", "Alioune"},
                    {"Diagne", "Coumba"}, {"Sagna", "Pierre"}};
            List<Utilisateur> clientsFictifs = new ArrayList<>();
            for (String[] nomPrenom : clients) {
                Utilisateur u = utilisateur(
                        nomPrenom[0], nomPrenom[1],
                        sansAccent(nomPrenom[1]) + "." + sansAccent(nomPrenom[0]) + "@exemple.sn",
                        passwordEncoder, null, Role.CLIENT);
                clientsFictifs.add(u);
                comptes.add(u);
            }
            clientsFictifs.add(client);
            utilisateurRepository.saveAll(comptes);

            // ----- Ingredients --------------------------------------------------
            Map<String, Ingredient> ing = new HashMap<>();
            ajouterIngredient(ing, ept, "Riz brisé", Unite.KILOGRAMME, 8, 60);
            ajouterIngredient(ing, ept, "Poisson thiof", Unite.KILOGRAMME, 5, 30);
            ajouterIngredient(ing, ept, "Poulet", Unite.KILOGRAMME, 5, 35);
            ajouterIngredient(ing, ept, "Viande de bœuf", Unite.KILOGRAMME, 4, 25);
            ajouterIngredient(ing, ept, "Agneau", Unite.KILOGRAMME, 3, 18);
            ajouterIngredient(ing, ept, "Légumes", Unite.KILOGRAMME, 6, 40);
            ajouterIngredient(ing, ept, "Oignons", Unite.KILOGRAMME, 5, 30);
            ajouterIngredient(ing, ept, "Pâte d'arachide", Unite.KILOGRAMME, 2, 12);
            ajouterIngredient(ing, ept, "Huile", Unite.LITRE, 4, 25);
            ajouterIngredient(ing, ept, "Mil", Unite.KILOGRAMME, 3, 15);
            ajouterIngredient(ing, ept, "Farine", Unite.KILOGRAMME, 3, 20);
            ajouterIngredient(ing, ept, "Lait caillé", Unite.LITRE, 3, 18);
            ajouterIngredient(ing, ept, "Sucre", Unite.KILOGRAMME, 2, 15);
            ajouterIngredient(ing, ept, "Fleurs de bissap", Unite.GRAMME, 400, 3000);
            ajouterIngredient(ing, ept, "Pulpe de bouye", Unite.GRAMME, 400, 3000);
            ajouterIngredient(ing, ept, "Gingembre", Unite.GRAMME, 300, 2000);
            ajouterIngredient(ing, ept, "Citron", Unite.KILOGRAMME, 2, 10);
            ajouterIngredient(ing, ept, "Mangue", Unite.KILOGRAMME, 2, 12);
            ingredientRepository.saveAll(ing.values());

            // ----- Plats et recettes --------------------------------------------
            List<Plat> platsEpt = new ArrayList<>();

            // Entrees
            Plat pastels = plat(platsEpt, ept, "Pastels au poisson",
                    "Beignets croustillants farcis au poisson et aux herbes", 800, CategoriePlat.ENTREE,
                    recette(ing.get("Farine"), "0.120"), recette(ing.get("Poisson thiof"), "0.080"),
                    recette(ing.get("Huile"), "0.050"));
            Plat fataya = plat(platsEpt, ept, "Fataya viande",
                    "Chausson doré à la viande hachée et aux oignons", 700, CategoriePlat.ENTREE,
                    recette(ing.get("Farine"), "0.110"), recette(ing.get("Viande de bœuf"), "0.070"),
                    recette(ing.get("Oignons"), "0.050"));
            Plat nems = plat(platsEpt, ept, "Accras de haricot",
                    "Petits beignets de niébé servis avec une sauce pimentée", 600, CategoriePlat.ENTREE,
                    recette(ing.get("Farine"), "0.100"), recette(ing.get("Huile"), "0.040"));
            Plat saladeAvocat = plat(platsEpt, ept, "Salade d'avocat et mangue",
                    "Avocat, mangue et citron vert, servis frais", 1200, CategoriePlat.ENTREE,
                    recette(ing.get("Mangue"), "0.150"), recette(ing.get("Citron"), "0.030"));
            Plat soupeKandia = plat(platsEpt, ept, "Soupou kandia",
                    "Soupe de gombo au poisson et à l'huile de palme", 1500, CategoriePlat.ENTREE,
                    recette(ing.get("Poisson thiof"), "0.120"), recette(ing.get("Légumes"), "0.150"),
                    recette(ing.get("Huile"), "0.060"));

            // Plats principaux
            Plat thieb = plat(platsEpt, ept, "Thiéboudienne",
                    "Riz au poisson, légumes et sauce tomate, le plat national", 2500,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Riz brisé"), "0.300"), recette(ing.get("Poisson thiof"), "0.250"),
                    recette(ing.get("Légumes"), "0.200"), recette(ing.get("Huile"), "0.040"));
            Plat thiebBlanc = plat(platsEpt, ept, "Thiéboudienne blanc",
                    "La version blanche, sans tomate, au poisson et aux légumes", 2500,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Riz brisé"), "0.300"), recette(ing.get("Poisson thiof"), "0.230"),
                    recette(ing.get("Légumes"), "0.200"));
            Plat yassaPoulet = plat(platsEpt, ept, "Yassa poulet",
                    "Poulet mariné aux oignons confits et au citron", 2000, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Poulet"), "0.300"), recette(ing.get("Riz brisé"), "0.250"),
                    recette(ing.get("Oignons"), "0.200"), recette(ing.get("Citron"), "0.040"));
            Plat yassaPoisson = plat(platsEpt, ept, "Yassa poisson",
                    "Poisson grillé, oignons confits et riz blanc", 2200, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Poisson thiof"), "0.280"), recette(ing.get("Riz brisé"), "0.250"),
                    recette(ing.get("Oignons"), "0.200"));
            Plat mafe = plat(platsEpt, ept, "Mafé",
                    "Viande et légumes mijotés dans une sauce à l'arachide", 2000,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Viande de bœuf"), "0.250"), recette(ing.get("Pâte d'arachide"), "0.080"),
                    recette(ing.get("Riz brisé"), "0.250"));
            Plat mafePoulet = plat(platsEpt, ept, "Mafé poulet",
                    "La sauce à l'arachide, avec du poulet fermier", 1900, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Poulet"), "0.260"), recette(ing.get("Pâte d'arachide"), "0.080"),
                    recette(ing.get("Riz brisé"), "0.250"));
            Plat domoda = plat(platsEpt, ept, "Domoda",
                    "Ragoût de bœuf à la tomate et aux légumes du jour", 2100,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Viande de bœuf"), "0.260"), recette(ing.get("Légumes"), "0.220"),
                    recette(ing.get("Riz brisé"), "0.250"));
            Plat thiereMbum = plat(platsEpt, ept, "Thiéré mbum",
                    "Couscous de mil aux feuilles de baobab et à la viande", 2000,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Mil"), "0.250"), recette(ing.get("Agneau"), "0.220"),
                    recette(ing.get("Légumes"), "0.150"));
            Plat dibi = plat(platsEpt, ept, "Dibi d'agneau",
                    "Agneau grillé au feu de bois, oignons et moutarde", 3000,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Agneau"), "0.350"), recette(ing.get("Oignons"), "0.150"));
            Plat cBoukhonk = plat(platsEpt, ept, "Caldou de poisson",
                    "Poisson poché au citron, riz blanc et légumes", 2300,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Poisson thiof"), "0.260"), recette(ing.get("Riz brisé"), "0.250"),
                    recette(ing.get("Citron"), "0.050"));
            Plat vermicelle = plat(platsEpt, ept, "Vermicelles au poulet",
                    "Vermicelles sautés, poulet et légumes croquants", 1800,
                    CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Farine"), "0.200"), recette(ing.get("Poulet"), "0.220"),
                    recette(ing.get("Légumes"), "0.150"));

            // Desserts
            Plat thiakry = plat(platsEpt, ept, "Thiakry",
                    "Couscous de mil au lait caillé, vanille et sucre", 700, CategoriePlat.DESSERT,
                    recette(ing.get("Mil"), "0.150"), recette(ing.get("Lait caillé"), "0.150"),
                    recette(ing.get("Sucre"), "0.030"));
            Plat sombi = plat(platsEpt, ept, "Sombi",
                    "Riz au lait parfumé à la fleur d'oranger", 800, CategoriePlat.DESSERT,
                    recette(ing.get("Riz brisé"), "0.100"), recette(ing.get("Lait caillé"), "0.180"),
                    recette(ing.get("Sucre"), "0.040"));
            Plat ngalax = plat(platsEpt, ept, "Ngalakh",
                    "Crème de mil, pâte d'arachide et pain de singe", 900, CategoriePlat.DESSERT,
                    recette(ing.get("Mil"), "0.120"), recette(ing.get("Pâte d'arachide"), "0.060"),
                    recette(ing.get("Pulpe de bouye"), "60"));
            Plat salade = plat(platsEpt, ept, "Salade de mangue",
                    "Mangue fraîche, citron vert et menthe", 800, CategoriePlat.DESSERT,
                    recette(ing.get("Mangue"), "0.200"), recette(ing.get("Citron"), "0.030"));
            Plat beignets = plat(platsEpt, ept, "Beignets sucrés",
                    "Beignets tièdes roulés dans le sucre", 500, CategoriePlat.DESSERT,
                    recette(ing.get("Farine"), "0.120"), recette(ing.get("Sucre"), "0.040"),
                    recette(ing.get("Huile"), "0.050"));

            // Boissons
            Plat bissap = plat(platsEpt, ept, "Jus de bissap",
                    "Infusion d'hibiscus servie bien fraîche", 500, CategoriePlat.BOISSON,
                    recette(ing.get("Fleurs de bissap"), "30"), recette(ing.get("Sucre"), "0.030"));
            Plat bouye = plat(platsEpt, ept, "Jus de bouye",
                    "Pulpe de fruit du baobab, onctueuse et peu sucrée", 500, CategoriePlat.BOISSON,
                    recette(ing.get("Pulpe de bouye"), "30"), recette(ing.get("Sucre"), "0.030"));
            Plat gingembre = plat(platsEpt, ept, "Jus de gingembre",
                    "Gingembre frais pressé, relevé au citron", 600, CategoriePlat.BOISSON,
                    recette(ing.get("Gingembre"), "40"), recette(ing.get("Citron"), "0.030"));
            Plat jusMangue = plat(platsEpt, ept, "Jus de mangue",
                    "Mangues mûres pressées le matin même", 700, CategoriePlat.BOISSON,
                    recette(ing.get("Mangue"), "0.250"));
            Plat eau = plat(platsEpt, ept, "Eau minérale 50 cl",
                    "Bouteille d'eau minérale", 300, CategoriePlat.BOISSON,
                    recette(ing.get("Sucre"), "0.001"));
            Plat cafeTouba = plat(platsEpt, ept, "Café Touba",
                    "Café au poivre de Selim, servi chaud", 400, CategoriePlat.BOISSON,
                    recette(ing.get("Sucre"), "0.020"));

            // Un plat retire de la carte : le gerant l'a desactive.
            Plat ancienPlat = plat(platsEpt, ept, "Poulet braisé",
                    "Plat retiré de la carte", 1900, CategoriePlat.PLAT_PRINCIPAL,
                    recette(ing.get("Poulet"), "0.300"));
            ancienPlat.setEstActif(false);

            platRepository.saveAll(platsEpt);

            // ----- Menus ---------------------------------------------------------
            LocalDate aujourdhui = LocalDate.now();

            // Carte permanente : en vigueur depuis deux mois, sans date de fin.
            Menu carte = menu(ept, "Carte permanente", aujourdhui.minusDays(60), null,
                    List.of(pastels, fataya, nems, thieb, yassaPoulet, mafe, domoda, vermicelle,
                            thiakry, sombi, beignets, bissap, bouye, gingembre, eau, cafeTouba));
            // Menu de la semaine : les plats du moment, par-dessus la carte.
            Menu semaine = menu(ept, "Menu de la semaine",
                    aujourdhui.with(DayOfWeek.MONDAY), aujourdhui.with(DayOfWeek.SUNDAY),
                    List.of(saladeAvocat, soupeKandia, thiebBlanc, yassaPoisson, mafePoulet,
                            thiereMbum, dibi, cBoukhonk, ngalax, salade, jusMangue));
            // Un menu deja termine : il n'est plus en vigueur, mais reste consultable
            // par le gerant (et les commandes qui le citent gardent leur prix).
            Menu passe = menu(ept, "Menu de la Tabaski",
                    aujourdhui.minusDays(45), aujourdhui.minusDays(38),
                    List.of(dibi, thiereMbum, ngalax, bissap));
            Menu futur = menu(ept, "Menu de fin d'année",
                    aujourdhui.plusDays(14), aujourdhui.plusDays(28),
                    List.of(dibi, cBoukhonk, saladeAvocat, sombi, jusMangue));

            menuRepository.saveAll(List.of(carte, semaine, passe, futur));

            // Les plats reellement commandables aujourd'hui, avec leur poids dans
            // les ventes : le thieboudienne part plus souvent que la salade.
            List<Plat> commandables = new ArrayList<>();
            for (Plat p : List.of(thieb, thieb, thieb, yassaPoulet, yassaPoulet, mafe, mafe,
                    domoda, vermicelle, thiebBlanc, yassaPoisson, mafePoulet, thiereMbum, dibi,
                    cBoukhonk, pastels, fataya, nems, saladeAvocat, soupeKandia,
                    thiakry, sombi, ngalax, salade, beignets,
                    bissap, bissap, bouye, gingembre, jusMangue, eau, cafeTouba)) {
                commandables.add(p);
            }

            // ----- Historique : commandes, paiements, caisses, stock --------------
            List<Commande> commandes = new ArrayList<>();
            List<Paiement> paiements = new ArrayList<>();
            List<SessionCaisse> sessions = new ArrayList<>();
            List<MouvementStock> mouvements = new ArrayList<>();
            Map<Ingredient, BigDecimal> sorties = new HashMap<>();

            List<Utilisateur> caissiers = List.of(caissier, comptes.get(8));
            List<Utilisateur> serveurs = List.of(serveur, comptes.get(6));

            for (int recul = JOURS_HISTORIQUE; recul >= 1; recul--) {
                LocalDate jour = aujourdhui.minusDays(recul);
                if (!ouvert(jour)) {
                    continue;
                }

                SessionCaisse session = new SessionCaisse();
                session.setCaissier(caissiers.get(recul % caissiers.size()));
                session.setDateHeureOuverture(instant(jour, LocalTime.of(8, 0)));
                session.setFondDeCaisse(20000);
                sessions.add(session);

                int encaisseEspeces = 0;
                int nombre = 9 + alea.nextInt(10) + (jour.getDayOfWeek() == DayOfWeek.FRIDAY ? 5 : 0);

                for (int i = 0; i < nombre; i++) {
                    LocalTime heure = LocalTime.of(11 + alea.nextInt(9), alea.nextInt(60));
                    boolean surPlace = alea.nextInt(100) < 65;
                    Commande c = new Commande();
                    c.setRestaurant(ept);
                    c.setDateHeure(instant(jour, heure));
                    if (surPlace) {
                        c.setType(TypeCommande.SUR_PLACE);
                        c.setServeur(serveurs.get(alea.nextInt(serveurs.size())));
                        c.setTable(ept.getTables().get(alea.nextInt(ept.getTables().size())));
                    } else {
                        c.setType(TypeCommande.A_EMPORTER);
                        if (alea.nextInt(100) < 70) {
                            c.setClient(clientsFictifs.get(alea.nextInt(clientsFictifs.size())));
                        } else {
                            c.setServeur(serveurs.get(alea.nextInt(serveurs.size())));
                        }
                    }

                    int nbLignes = 1 + alea.nextInt(3);
                    for (int l = 0; l < nbLignes; l++) {
                        ajouterLigne(c, commandables.get(alea.nextInt(commandables.size())),
                                1 + alea.nextInt(2));
                    }

                    // Quatre commandes sur cent n'aboutissent pas : deux annulees
                    // avant preparation, deux abandonnees apres (cahier §4.3).
                    int sort = alea.nextInt(100);
                    if (sort < 2) {
                        c.setStatut(StatutCommande.ANNULEE);
                    } else if (sort < 4) {
                        c.setStatut(StatutCommande.ABANDONNEE);
                        consommer(c, sorties, mouvements, instant(jour, heure.plusMinutes(8)));
                    } else {
                        c.setStatut(StatutCommande.PAYEE);
                        consommer(c, sorties, mouvements, instant(jour, heure.plusMinutes(8)));

                        Paiement p = new Paiement();
                        p.setCommande(c);
                        p.setSessionCaisse(session);
                        boolean especes = alea.nextInt(100) < 62;
                        p.setModePaiement(especes ? ModePaiement.ESPECES : ModePaiement.MOBILE_MONEY);
                        p.setDateHeure(instant(jour, heure.plusMinutes(35)));
                        paiements.add(p);
                        if (especes) {
                            encaisseEspeces += montant(c);
                        }
                    }
                    commandes.add(c);
                }

                // Cloture : le montant compte s'ecarte parfois un peu du theorique.
                int ecart = switch (alea.nextInt(10)) {
                    case 0 -> -500;
                    case 1 -> 1000;
                    case 2 -> -1000;
                    default -> 0;
                };
                session.setDateHeureCloture(instant(jour, LocalTime.of(21, 15)));
                session.setMontantCompte(20000 + encaisseEspeces + ecart);
            }

            // ----- Aujourd'hui : une commande dans chaque statut -------------------
            SessionCaisse sessionDuJour = new SessionCaisse();
            sessionDuJour.setCaissier(caissier);
            sessionDuJour.setDateHeureOuverture(instant(aujourdhui, LocalTime.of(8, 0)));
            sessionDuJour.setFondDeCaisse(20000);
            sessions.add(sessionDuJour);

            List<TableRestaurant> tables = ept.getTables();
            Commande enAttente = duJour(ept, client, null, null, TypeCommande.A_EMPORTER,
                    StatutCommande.EN_ATTENTE, minutesAvant(25));
            ajouterLigne(enAttente, thieb, 1);
            ajouterLigne(enAttente, bissap, 2);

            Commande enAttente2 = duJour(ept, null, serveur, tables.get(3), TypeCommande.SUR_PLACE,
                    StatutCommande.EN_ATTENTE, minutesAvant(18));
            ajouterLigne(enAttente2, yassaPoisson, 2);
            ajouterLigne(enAttente2, pastels, 1);

            Commande enPrepa = duJour(ept, null, serveur, tables.get(0), TypeCommande.SUR_PLACE,
                    StatutCommande.EN_PREPARATION, minutesAvant(42));
            ajouterLigne(enPrepa, yassaPoulet, 2);
            ajouterLigne(enPrepa, thiakry, 2);
            consommer(enPrepa, sorties, mouvements, minutesAvant(38));

            Commande enPrepa2 = duJour(ept, clientsFictifs.get(1), null, null, TypeCommande.A_EMPORTER,
                    StatutCommande.EN_PREPARATION, minutesAvant(33));
            ajouterLigne(enPrepa2, dibi, 1);
            consommer(enPrepa2, sorties, mouvements, minutesAvant(30));

            Commande prete = duJour(ept, null, serveur, tables.get(1), TypeCommande.SUR_PLACE,
                    StatutCommande.PRETE, minutesAvant(58));
            ajouterLigne(prete, mafe, 1);
            ajouterLigne(prete, gingembre, 1);
            consommer(prete, sorties, mouvements, minutesAvant(52));

            Commande prete2 = duJour(ept, clientsFictifs.get(4), null, null, TypeCommande.A_EMPORTER,
                    StatutCommande.PRETE, minutesAvant(50));
            ajouterLigne(prete2, thiebBlanc, 2);
            consommer(prete2, sorties, mouvements, minutesAvant(44));

            Commande payeeDuJour = duJour(ept, client, null, null, TypeCommande.A_EMPORTER,
                    StatutCommande.PAYEE, minutesAvant(140));
            ajouterLigne(payeeDuJour, thiakry, 2);
            ajouterLigne(payeeDuJour, cafeTouba, 1);
            consommer(payeeDuJour, sorties, mouvements, minutesAvant(132));
            Paiement paiementDuJour = new Paiement();
            paiementDuJour.setCommande(payeeDuJour);
            paiementDuJour.setSessionCaisse(sessionDuJour);
            paiementDuJour.setModePaiement(ModePaiement.ESPECES);
            paiementDuJour.setDateHeure(minutesAvant(120));
            paiements.add(paiementDuJour);

            Commande annulee = duJour(ept, clientsFictifs.get(2), null, null, TypeCommande.A_EMPORTER,
                    StatutCommande.ANNULEE, minutesAvant(95));
            ajouterLigne(annulee, bissap, 1);

            Commande abandonnee = duJour(ept, null, serveur, tables.get(2), TypeCommande.SUR_PLACE,
                    StatutCommande.ABANDONNEE, minutesAvant(180));
            ajouterLigne(abandonnee, domoda, 3);
            consommer(abandonnee, sorties, mouvements, minutesAvant(172));

            commandes.addAll(List.of(enAttente, enAttente2, enPrepa, enPrepa2, prete, prete2,
                    payeeDuJour, annulee, abandonnee));

            // ----- Entrees de stock : elles couvrent les sorties et laissent un
            // etat final lisible (quelques alertes, une rupture). -------------------
            for (Ingredient i : ing.values()) {
                BigDecimal sortie = sorties.getOrDefault(i, BigDecimal.ZERO);
                BigDecimal cible = etatFinalVoulu(i);
                BigDecimal aEntrer = sortie.add(cible);
                if (aEntrer.signum() <= 0) {
                    continue;
                }
                // Une livraison par semaine, la premiere le jour de l'ouverture.
                int livraisons = JOURS_HISTORIQUE / 7;
                BigDecimal parLivraison = aEntrer.divide(
                        BigDecimal.valueOf(livraisons), 3, RoundingMode.DOWN);
                BigDecimal cumul = BigDecimal.ZERO;
                for (int n = 0; n < livraisons; n++) {
                    BigDecimal quantite = n == livraisons - 1 ? aEntrer.subtract(cumul) : parLivraison;
                    cumul = cumul.add(quantite);
                    MouvementStock m = new MouvementStock();
                    m.setIngredient(i);
                    m.setType(TypeMouvement.ENTREE);
                    m.setQuantite(quantite);
                    m.setDateHeure(instant(aujourdhui.minusDays(JOURS_HISTORIQUE - 7L * n),
                            LocalTime.of(7, 30)));
                    mouvements.add(m);
                }
            }

            commandeRepository.saveAll(commandes);
            sessionCaisseRepository.saveAll(sessions);
            paiementRepository.saveAll(paiements);
            mouvementStockRepository.saveAll(mouvements);

            // ----- Reservations ----------------------------------------------------
            List<Reservation> reservations = new ArrayList<>();
            List<ReservationTable> occupees = new ArrayList<>();
            for (int recul = 20; recul >= -12; recul--) {
                LocalDate jour = aujourdhui.minusDays(recul);
                if (!ouvert(jour)) {
                    continue;
                }
                int nombre = 1 + alea.nextInt(3);
                for (int i = 0; i < nombre; i++) {
                    LocalTime heure = LocalTime.of(12 + alea.nextInt(8), alea.nextInt(2) * 30);
                    int couverts = 2 + alea.nextInt(7);
                    Reservation r = reserver(ept, clientsFictifs.get(alea.nextInt(clientsFictifs.size())),
                            LocalDateTime.of(jour, heure), couverts, occupees);
                    if (r != null) {
                        // Une reservation passee sur dix a ete annulee par le client.
                        if (recul > 0 && alea.nextInt(10) == 0) {
                            r.setStatut(StatutReservation.ANNULEE);
                            r.getTables().forEach(t -> t.setStatut(StatutReservation.ANNULEE));
                            occupees.removeAll(r.getTables());
                        }
                        reservations.add(r);
                    }
                }
            }
            reservationRepository.saveAll(reservations);

            // ----- Journal des operations -------------------------------------------
            List<JournalOperation> journal = new ArrayList<>();
            journal.add(entree(admin, ActionJournal.RESTAURANT_CREE, "Restaurant", ept.getId(),
                    "Restaurant de l'EPT", instant(aujourdhui.minusDays(60), LocalTime.of(9, 12))));
            journal.add(entree(admin, ActionJournal.COMPTE_CREE, "Utilisateur", gerant.getId(),
                    "Khadim Faye : gérant", instant(aujourdhui.minusDays(60), LocalTime.of(9, 40))));
            journal.add(entree(admin, ActionJournal.COMPTE_CREE, "Utilisateur", gerantCaissier.getId(),
                    "Sokhna Mbaye : gérant, caissier", instant(aujourdhui.minusDays(20), LocalTime.of(11, 40))));
            journal.add(entree(admin, ActionJournal.ROLES_MODIFIES, "Utilisateur", gerantCaissier.getId(),
                    "Ajout du rôle caissier", instant(aujourdhui.minusDays(19), LocalTime.of(9, 5))));
            journal.add(entree(admin, ActionJournal.COMPTE_DESACTIVE, "Utilisateur", ancien.getId(),
                    "Babacar Kane", instant(aujourdhui.minusDays(12), LocalTime.of(16, 30))));
            journal.add(entree(admin, ActionJournal.RESTAURANT_MODIFIE, "Restaurant", ept.getId(),
                    "Ajout des tables 7 à 9", instant(aujourdhui.minusDays(9), LocalTime.of(8, 45))));
            journal.add(entree(cuisinier, ActionJournal.RUPTURE_SIGNALEE, "Ingredient",
                    ing.get("Agneau").getId(), "Agneau",
                    instant(aujourdhui.minusDays(3), LocalTime.of(12, 20))));
            journal.add(entree(gerant, ActionJournal.COMMANDE_ABANDONNEE, "Commande",
                    abandonnee.getId(), "Commande non réglée",
                    instant(aujourdhui, LocalTime.now().minusHours(2))));
            journal.add(entree(caissier, ActionJournal.CAISSE_OUVERTE, "SessionCaisse",
                    sessionDuJour.getId(), "Fond de caisse : 20 000 FCFA",
                    instant(aujourdhui, LocalTime.of(8, 0))));
            journal.add(entree(caissier, ActionJournal.COMMANDE_ENCAISSEE, "Commande",
                    payeeDuJour.getId(), "Espèces", minutesAvant(120)));
            journalOperationRepository.saveAll(journal);
        };
    }

    // ---------------------------------------------------------------------
    // Fabriques
    // ---------------------------------------------------------------------

    private static Restaurant restaurant(
            String nom, String adresse, String telephone, int dureeReservation,
            int[][] tables, LocalTime ouverture, LocalTime fermeture, boolean ouvreLeSamedi) {
        Restaurant r = new Restaurant();
        r.setNom(nom);
        r.setAdresse(adresse);
        r.setTelephone(telephone);
        r.setDureeReservationMinutes(dureeReservation);
        r.setEstActif(true);
        for (int[] t : tables) {
            TableRestaurant table = new TableRestaurant();
            table.setRestaurant(r);
            table.setNumero(t[0]);
            table.setCapacite(t[1]);
            r.getTables().add(table);
        }
        List<JourSemaine> jours = new ArrayList<>(List.of(
                JourSemaine.LUNDI, JourSemaine.MARDI, JourSemaine.MERCREDI,
                JourSemaine.JEUDI, JourSemaine.VENDREDI));
        if (ouvreLeSamedi) {
            jours.add(JourSemaine.SAMEDI);
        }
        for (JourSemaine jour : jours) {
            HoraireOuverture h = new HoraireOuverture();
            h.setRestaurant(r);
            h.setJour(jour);
            h.setHeureOuverture(ouverture);
            h.setHeureFermeture(fermeture);
            r.getHoraires().add(h);
        }
        return r;
    }

    private static Utilisateur utilisateur(
            String nom, String prenom, String email, PasswordEncoder encoder,
            Restaurant restaurant, Role role) {
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

    private static void ajouterIngredient(
            Map<String, Ingredient> cible, Restaurant restaurant, String nom, Unite unite,
            double seuilAlerte, double niveauCible) {
        Ingredient i = new Ingredient();
        i.setRestaurant(restaurant);
        i.setNom(nom);
        i.setUnite(unite);
        i.setSeuilAlerte(BigDecimal.valueOf(seuilAlerte));
        i.setNiveauCible(BigDecimal.valueOf(niveauCible));
        cible.put(nom, i);
    }

    private static Recette recette(Ingredient ingredient, String quantite) {
        Recette r = new Recette();
        r.setIngredient(ingredient);
        r.setQuantiteNecessaire(new BigDecimal(quantite));
        return r;
    }

    private static Plat plat(
            List<Plat> cible, Restaurant restaurant, String nom, String description, int prix,
            CategoriePlat categorie, Recette... recettes) {
        Plat plat = new Plat();
        plat.setRestaurant(restaurant);
        plat.setNom(nom);
        plat.setDescription(description);
        plat.setPrix(prix);
        plat.setCategorie(categorie);
        plat.setEstActif(true);
        for (Recette r : recettes) {
            r.setPlat(plat);
            plat.getRecette().add(r);
        }
        cible.add(plat);
        return plat;
    }

    private static Menu menu(
            Restaurant restaurant, String nom, LocalDate debut, LocalDate fin, List<Plat> plats) {
        Menu m = new Menu();
        m.setRestaurant(restaurant);
        m.setNom(nom);
        m.setDateDebut(debut);
        m.setDateFin(fin);
        m.getPlats().addAll(plats);
        return m;
    }

    // ---------------------------------------------------------------------
    // Commandes
    // ---------------------------------------------------------------------

    private static Commande duJour(
            Restaurant restaurant, Utilisateur client, Utilisateur serveur, TableRestaurant table,
            TypeCommande type, StatutCommande statut, Instant quand) {
        Commande c = new Commande();
        c.setRestaurant(restaurant);
        c.setClient(client);
        c.setServeur(serveur);
        c.setTable(table);
        c.setType(type);
        c.setStatut(statut);
        c.setDateHeure(quand);
        return c;
    }

    /** Regle 4 : la ligne retient le prix du plat au moment ou elle est creee. */
    private static void ajouterLigne(Commande commande, Plat plat, int quantite) {
        LigneCommande ligne = new LigneCommande();
        ligne.setCommande(commande);
        ligne.setPlat(plat);
        ligne.setQuantite(quantite);
        ligne.setPrixUnitaire(plat.getPrix());
        commande.getLignes().add(ligne);
    }

    private static int montant(Commande commande) {
        return commande.getLignes().stream()
                .mapToInt(l -> l.getPrixUnitaire() * l.getQuantite())
                .sum();
    }

    /**
     * Demarrer la preparation sort du stock la quantite prevue par la recette,
     * pour chaque plat commande (cahier §4.3).
     */
    private static void consommer(
            Commande commande, Map<Ingredient, BigDecimal> cumul,
            List<MouvementStock> mouvements, Instant quand) {
        for (LigneCommande ligne : commande.getLignes()) {
            for (Recette r : ligne.getPlat().getRecette()) {
                BigDecimal quantite = r.getQuantiteNecessaire()
                        .multiply(BigDecimal.valueOf(ligne.getQuantite()));
                MouvementStock m = new MouvementStock();
                m.setIngredient(r.getIngredient());
                m.setType(TypeMouvement.SORTIE);
                m.setQuantite(quantite);
                m.setDateHeure(quand);
                mouvements.add(m);
                cumul.merge(r.getIngredient(), quantite, BigDecimal::add);
            }
        }
    }

    /**
     * Etat de stock voulu a la fin de l'historique : la plupart des ingredients
     * confortables, trois sous leur seuil d'alerte et un a zero, pour que les
     * alertes et les recommandations d'approvisionnement aient du contenu.
     */
    private static BigDecimal etatFinalVoulu(Ingredient i) {
        return switch (i.getNom()) {
            case "Agneau" -> BigDecimal.ZERO;
            case "Pâte d'arachide" -> i.getSeuilAlerte().multiply(new BigDecimal("0.6"));
            case "Citron" -> i.getSeuilAlerte().multiply(new BigDecimal("0.8"));
            case "Gingembre" -> i.getSeuilAlerte().multiply(new BigDecimal("0.7"));
            case "Mangue" -> i.getNiveauCible().multiply(new BigDecimal("0.35"));
            default -> i.getNiveauCible().multiply(new BigDecimal("0.72"));
        };
    }

    // ---------------------------------------------------------------------
    // Reservations
    // ---------------------------------------------------------------------

    /**
     * Choisit les tables comme la plateforme le fait (regle 7) : celles qui
     * laissent le moins de places inutilisees, puis le moins de tables, parmi
     * celles qui sont libres sur le creneau (regle 8). Rend null si la salle
     * ne peut pas accueillir ce groupe a cette heure.
     */
    private Reservation reserver(
            Restaurant restaurant, Utilisateur client, LocalDateTime debut, int couverts,
            List<ReservationTable> deja) {
        LocalDateTime fin = debut.plusMinutes(restaurant.getDureeReservationMinutes());
        List<TableRestaurant> libres = new ArrayList<>();
        for (TableRestaurant t : restaurant.getTables()) {
            boolean prise = deja.stream().anyMatch(rt -> rt.getTable() == t
                    && rt.getHeureDebut().isBefore(fin) && debut.isBefore(rt.getHeureFin()));
            if (!prise) {
                libres.add(t);
            }
        }
        libres.sort((a, b) -> Integer.compare(b.getCapacite(), a.getCapacite()));

        List<TableRestaurant> retenues = new ArrayList<>();
        int places = 0;
        for (TableRestaurant t : libres) {
            if (places >= couverts) {
                break;
            }
            retenues.add(t);
            places += t.getCapacite();
        }
        if (places < couverts) {
            return null;
        }

        Reservation r = new Reservation();
        r.setRestaurant(restaurant);
        r.setClient(client);
        r.setDateHeure(debut);
        r.setDureeMinutes(restaurant.getDureeReservationMinutes());
        r.setNombreCouverts(couverts);
        r.setStatut(StatutReservation.CONFIRMEE);
        for (TableRestaurant t : retenues) {
            ReservationTable rt = new ReservationTable();
            rt.setReservation(r);
            rt.setTable(t);
            rt.setHeureDebut(debut);
            rt.setHeureFin(fin);
            rt.setStatut(StatutReservation.CONFIRMEE);
            r.getTables().add(rt);
            deja.add(rt);
        }
        return r;
    }

    // ---------------------------------------------------------------------
    // Journal et utilitaires
    // ---------------------------------------------------------------------

    private static JournalOperation entree(
            Utilisateur acteur, ActionJournal action, String objetType, Long objetId,
            String details, Instant quand) {
        JournalOperation j = new JournalOperation();
        j.setActeur(acteur);
        j.setAction(action);
        j.setObjetType(objetType);
        j.setObjetId(objetId);
        j.setDetails(details);
        j.setDateHeure(quand);
        return j;
    }

    /** Le restaurant de l'EPT ouvre du lundi au vendredi. */
    private static boolean ouvert(LocalDate jour) {
        return jour.getDayOfWeek() != DayOfWeek.SATURDAY && jour.getDayOfWeek() != DayOfWeek.SUNDAY;
    }

    private static Instant instant(LocalDate jour, LocalTime heure) {
        return jour.atTime(heure).atZone(ZONE).toInstant();
    }

    private static Instant minutesAvant(int minutes) {
        return Instant.now().minusSeconds(minutes * 60L);
    }

    /** Adresse e-mail simple a partir d'un nom : « Sène » donne « sene ». */
    private static String sansAccent(String texte) {
        return java.text.Normalizer.normalize(texte, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z]", "");
    }
}
