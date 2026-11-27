# Refonte premium — plan et bilan

Branche : `refonte/premium`.

Objectif : porter la plateforme au niveau d'un produit professionnel, sans toucher
au cahier des charges ni au périmètre fonctionnel.

---

## 0. Point d'attention à trancher par l'équipe

La direction artistique demandée (« VERDE » : bleu nuit, vert, orange) **s'éloigne
des écrans de référence du dossier projet** (bandeau jaune, rouge vif, fond crème),
qui servaient jusqu'ici de base au design. Sur un projet noté, un jury peut comparer
l'interface aux maquettes fournies.

Choix retenu pour ce chantier : appliquer la direction VERDE, en gardant

- le logo SAES lisible dans les deux thèmes,
- la **structure** des écrans de référence (bandeau du restaurant, barre latérale du
  personnel, titre + action à droite, cartes de commande), qui n'est pas remise en
  cause.

Revenir en arrière coûte peu : toutes les couleurs sont des variables groupées en
tête de `saes-frontend/src/styles.scss`.

---

## 1. Audit initial

| Point | Constat |
| --- | --- |
| Backend | Spring Boot 4.1 / Java 21, 24 contrôleurs, 25 services, 5 migrations Flyway, JWT + BCrypt, verrous pessimistes et `@Version` |
| Frontend | Angular 22 standalone + signaux, 28 routes, ~45 composants |
| Design | Tokens déjà centralisés, modes clair et sombre déjà en place |
| Page d'accueil | **Inexistante** : `/` redirigeait vers `/menus` |
| Données de démo | 1 restaurant, 6 plats, 1 menu, 6 commandes, 0 réservation, 0 mouvement de stock, 0 session de caisse → rapports et statistiques vides |
| Graphiques | Un seul composant maison de barres |
| Typographie | Une seule police, peu de hiérarchie |

**Causes de l'impression de vide** : pas de vitrine d'entrée, données de démonstration
couvrant une seule journée, une seule police, peu de visuels.

---

## 2. Travaux réalisés

| # | Lot | État |
| --- | --- | --- |
| B | Design system premium | **fait** |
| C | Page d'accueil | **fait** |
| D1 | Espace client (bandeau immersif, suggestions, panier, suivi) | **fait** |
| D2 | Espace serveur (plan de salle) | **fait** |
| D3 | Espace cuisine (colonnes par statut, temps d'attente) | **fait** |
| D4 | Espace caissier (temps d'attente des commandes prêtes) | **partiel** |
| D5 | Espace gérant (graphiques, jauges de stock, alertes) | **fait** |
| D6 | Espace administrateur (cartes sur téléphone) | **fait** |
| E | Données de démonstration | **fait** |
| F | Responsive et vérification visuelle | **partiel** |
| G | Tests, conformité, `DEMO_JURY.md` | **fait** |

### B — Design system

- Palette refondue : bleu nuit `#080F19`, vert `#76B947`, orange `#FF8500`, crème
  `#F5F2EA`, déclinée en deux thèmes complets.
- Typographie éditoriale : **Playfair Display** pour les grands titres,
  **Plus Jakarta Sans** pour l'interface. Les nombres et les tableaux restent en
  linéaire (les chiffres à empattement s'alignent mal en colonne).
- Nouveaux jetons : `--saes-action` (vert, action principale), `--saes-jaune`
  (orange), `--saes-prix`, `--saes-serie-1..6`, `--saes-ombre-haute`,
  `--saes-surface-haute`, `--saes-rayon-*`.
- Le rouge est **réservé au danger** : les boutons principaux sont passés au vert.
- Nouveaux styles communs : `.btn-accent`, `.btn-danger`, `.btn-discret`,
  `.sur-titre`.
- Toutes les couleurs écrites en dur dans les composants ont été remplacées par
  des jetons.

### C — Page d'accueil (`/`) et barre de navigation

Barre de navigation en haut pour le visiteur et le client : **Accueil, Menu,
Traiteur, Photos**. La page d'accueil enchaîne une grande photo d'ouverture, le
menu, le traiteur, un aperçu des photos et le restaurant. Les pages **Traiteur**
et **Photos** sont des présentations sans formulaire. Les photos se changent dans
`core/photos-site.ts`.

Vitrine du visiteur et du client. Le personnel reste renvoyé vers sa première
fonction (`vitrineGuard`). Tout ce qu'elle affiche vient du backend : plats du
menu en vigueur et leur prix, catégories réellement proposées, restaurants avec
leurs horaires du jour et leur état d'ouverture. Elle ne propose que les
fonctions du cahier des charges : consulter les menus, commander à emporter,
réserver.

### D — Les six espaces

- **Client** : bandeau du restaurant devenu une image d'ouverture (photo en fond,
  dégradé bleu nuit), message « ajouté au panier » avec lien vers le panier,
  frise *Reçue → En préparation → Prête*.
- **Serveur** : plan de salle. Chaque table est dessinée vue de dessus avec ses
  couverts, son état écrit et sa prochaine réservation du jour. Quatre chiffres
  en tête : tables libres, occupées, places libres, réservations.
- **Cuisine** : deux colonnes, *À démarrer* et *En préparation* — les deux seuls
  statuts que voit le cuisinier. Temps d'attente par commande, qui passe en
  orange à 20 minutes et en rouge à 35. Quantités en pastille.
- **Caissier** : temps d'attente ajouté aux commandes prêtes.
- **Gérant** : graphiques Chart.js (anneau des catégories, barres des plats les
  plus vendus, barres empilées des encaissements par jour, anneau des modes de
  paiement, barres des écarts de caisse), bandeau d'alerte des stocks bas,
  jauge *stock / niveau cible* avec repère du seuil sur chaque ligne.
- **Administrateur** : les trois tableaux deviennent des cartes sur téléphone.

### E — Données de démonstration

`DataSeeder` réécrit. Profil `dev` seulement, inséré uniquement si la base est
vide, tirage à graine fixe (jeu identique partout).

| Objet | Volume |
| --- | --- |
| Restaurants | 1 (le restaurant de l'EPT ; l'administrateur en ajoute d'autres) |
| Comptes | 21 (6 de référence + personnel + 10 clients) |
| Plats | 6 (la carte d'origine : thiéboudienne, yassa poulet, mafé, thiakry, jus de bissap, jus de bouye) |
| Ingrédients | 7 |
| Menus | 1 (« Menu de la semaine ») |
| Commandes | environ 720 sur 10 semaines |
| Lignes de commande | environ 1 450 |
| Paiements | environ 690 |
| Sessions de caisse | 51 |
| Mouvements de stock | environ 2 700 |
| Réservations | 39 |
| Entrées de journal | 10 |

Le restaurant du SAES est un restaurant simple, au sein de l'école : la carte
reste celle d'origine, à six plats. Une première version du jeu de données en
comptait 42, puis 28 ; elle a été ramenée à la carte d'origine.

État de stock obtenu volontairement : 3 ingrédients sous leur seuil d'alerte
(poisson, mil, pulpe de bouye), pour que les alertes et les recommandations
aient du contenu.

### Graphiques

Chart.js 4.4.7, enveloppé dans un composant `app-graphique` qui lit les couleurs
dans les variables du thème et se redessine au changement de mode. Les palettes
de séries ont été **vérifiées par le validateur de la méthode de visualisation**
(bandes de clarté, chroma, écart entre couleurs voisines sous daltonisme,
contraste sur le fond) : les deux modes passent tous les contrôles. Chaque
graphique est doublé d'un tableau équivalent, lu par les lecteurs d'écran.

---

## 3. Matrice de conformité au cahier des charges

Aucune fonction n'a été ajoutée, retirée ou modifiée. Les responsabilités des
rôles, les statuts et les workflows sont inchangés.

| § | Fonction | Écran | État |
| --- | --- | --- | --- |
| 4.1 | S'inscrire | `/inscription` | inchangé |
| 4.1 | S'authentifier | `/connexion` | inchangé |
| 4.1 | Gérer son compte | `/mon-compte` | inchangé |
| 4.2 | Consulter les menus | `/menus` | **présentation refaite** |
| 4.2 | Gérer les plats | `/gerant/plats` | inchangé |
| 4.2 | Gérer les menus | `/gerant/menus` | inchangé |
| 4.3 | Passer une commande | `/menus` + panier | **présentation refaite** |
| 4.3 | Suivre sa commande | `/mes-commandes` | **frise ajoutée (affichage)** |
| 4.3 | Annuler sa commande | `/mes-commandes` | inchangé |
| 4.3 | Prendre une commande | `/serveur/prendre-commande` | inchangé |
| 4.3 | Modifier ou annuler une commande | `/serveur/commandes` | inchangé |
| 4.3 | Visualiser l'occupation des tables | `/serveur/occupation` | **présentation refaite** |
| 4.3 | Gérer la préparation | `/cuisine/preparation` | **présentation refaite** |
| 4.3 | Déclarer une commande abandonnée | `/gerant/commandes` | inchangé |
| 4.4 | Faire une réservation | `/mes-reservations` | inchangé |
| 4.4 | Gérer ses réservations | `/mes-reservations` | inchangé |
| 4.5 | Ouvrir la caisse | `/caissier/ouvrir` | inchangé |
| 4.5 | Encaisser une commande | `/caissier/encaisser` | **temps d'attente ajouté** |
| 4.5 | Clôturer la caisse | `/caissier/cloturer` | inchangé |
| 4.5 | Consulter les rapports financiers | `/gerant/rapports-financiers` | **graphiques ajoutés ; aussi en lecture seule pour l'administrateur (écart assumé)** |
| 4.6 | Gérer les stocks | `/gerant/stocks` | **alertes et jauges ajoutées** |
| 4.6 | Consulter les statistiques de ventes | `/gerant/statistiques-ventes` | **graphiques ajoutés ; aussi en lecture seule pour l'administrateur (écart assumé)** |
| 4.6 | Consulter les recommandations | `/gerant/recommandations` | inchangé |
| 4.6 | Signaler une rupture | `/cuisine/rupture` | inchangé |
| 4.7 | Gérer les comptes utilisateurs | `/admin/utilisateurs` | **cartes sur téléphone** |
| 4.7 | Gérer les restaurants | `/admin/restaurants` | **cartes sur téléphone ; écran d'arrivée « Choisir un restaurant » ajouté** |

« Présentation refaite » veut dire : mêmes données, mêmes règles, mêmes actions,
mise en page et styles différents.

### Écarts assumés au cahier des charges (décidés par l'équipe)

Ces trois points ne figurent pas au cahier des charges. Ils ont été demandés et
sont documentés ici pour être expliqués au jury.

| Écart | Ce qui est fait | Garde-fous |
| --- | --- | --- |
| **Supervision par l'administrateur** (§4.5 et §4.6 réservent statistiques, rapports, stocks et recommandations au gérant) | À sa connexion, l'administrateur choisit un restaurant (`/admin/choix`), puis consulte ses statistiques, rapports, stocks, recommandations, informations et comptes | **Lecture seule** : aucune route d'écriture. Mêmes services et mêmes chiffres que le gérant. Les autres rôles n'ont pas accès. `SupervisionAdminTest` : 6 tests |
| **Page Traiteur** | Une page de présentation (formules, comment faire une demande, téléphone du restaurant) | Aucun formulaire, aucune commande traiteur, aucune fonction métier |
| **Page Photos** | Une galerie avec agrandissement | Contenu statique |

Conséquence sur la qualité attendue n° 1 (« chaque utilisateur n'accède qu'aux
fonctions de ses rôles ») : elle reste vraie pour tous les rôles sauf
l'administrateur, qui a désormais en lecture ce que le gérant a en lecture et en
écriture.

### Éléments hors cahier des charges (déjà présents avant ce chantier)

- Connexion et inscription avec Google.
- Journal des opérations de l'administrateur.

### Ajouts de ce chantier qui ne sont pas des fonctions métier

- **Page d'accueil** : une vitrine qui ne fait que présenter les données déjà
  accessibles et renvoyer vers les fonctions existantes. Elle n'ajoute aucune
  action.
- **Temps d'attente** affiché en cuisine et en caisse : un repère visuel, calculé
  dans le navigateur à partir de la date d'arrivée déjà renvoyée par l'API. Il ne
  change ni le statut, ni l'ordre de préparation.
- **Montant total vendu** et **nombre de caisses clôturées** : deux sommes des
  données déjà renvoyées, affichées en chiffre clé.

---

## 4. Vérifications

| Vérification | Résultat |
| --- | --- |
| `ng build` | passe |
| `ng test` | 55 tests, tous verts (13 fichiers) |
| `./mvnw verify` | voir le bilan de la session |
| Largeurs testées | 360, 390, 768, 1440, 1920 px — aucun débordement horizontal |
| Palettes de graphiques | validées en clair et en sombre |

### Tests ajoutés

- `core/montant.util.spec.ts` — abréviation des montants (4 cas).
- `shared/temps-ecoule.spec.ts` — minutes, heures, seuils, mise à jour (4 cas).
- `core/auth.guard.spec.ts` — `vitrineGuard` (4 cas).

---

## 5. Ce qui reste à faire

- Vérifier à l'écran : `/mon-compte`, `/mes-reservations`, `/cuisine/rupture`,
  `/gerant/menus`, `/gerant/reservations`, `/caissier/cloturer` et les
  formulaires d'édition, en clair et en sombre.
- Largeur 1024 px non testée.
- Navigation au clavier et ordre de tabulation non revérifiés après la refonte.
- **Photographies** : les six plats de la carte ont une photo. Pour remplacer
  une photo : remplacer ses deux fichiers `public/assets/plats/<nom-du-plat>-360.webp`
  et `-720.webp` (ratio 9:10), sous le même nom.
- `/gerant/plats` et `/gerant/menus` n'ont pas été retravaillés.

---

## 6. Journal

- 2026-11-26 — Branche créée, audit, plan.
- 2026-11-26 — Design system, page d'accueil, données de démonstration.
- 2026-11-26 — Cuisine, serveur, gérant, caisse, pied de page.
- 2026-11-26 — Tests, matrice de conformité, scénario de démonstration.
- 2026-11-26 — Retour de l'équipe : un seul restaurant au départ, accueil refait
  (photo, menu, traiteur, photos, barre de navigation), supervision de
  l'administrateur par restaurant.
