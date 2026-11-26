# Scénario de démonstration — soutenance

Sujet 17, projet transversal DIC1, École polytechnique de Thiès.
Durée visée : **12 à 15 minutes**, six rôles, un seul fil conducteur.

Toutes les étapes n'utilisent que des fonctions du cahier des charges. Rien n'est
simulé : chaque écran montre les données réelles de la base.

---

## 1. Avant de commencer

```bash
# 1. La base
docker compose up -d db

# 2. Le backend (profil dev : jeu de démonstration si la base est vide)
cd saes-backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Le frontend
cd saes-frontend && npm start     # http://localhost:4200
```

Vérifications d'avant-match :

- [ ] La page d'accueil s'ouvre sur `http://localhost:4200`.
- [ ] Les trois restaurants apparaissent, celui de l'EPT est « Ouvert ».
- [ ] Les statistiques du gérant affichent un mois de ventes.
- [ ] Préparer **deux fenêtres** côte à côte : une pour le client, une pour le
      personnel (deux profils de navigateur, ou une fenêtre privée).

**Comptes** (mot de passe : `password123`)

| Rôle | Adresse |
| --- | --- |
| Client | `client@saes.sn` |
| Serveur | `serveur@saes.sn` |
| Cuisinier | `cuisinier@saes.sn` |
| Caissier | `caissier@saes.sn` |
| Gérant | `gerant@saes.sn` |
| Administrateur | `admin@saes.sn` |

---

## 2. Le fil : une commande, de la salle à la caisse

### Étape 1 — La vitrine (visiteur, 1 min)

Ouvrir `/` sans être connecté.

À montrer : l'ouverture, les chiffres du jour (nombre de plats au menu, de
catégories, de restaurants ouverts) qui **viennent du backend**, les suggestions
du menu en vigueur avec leur prix du jour, et les trois restaurants avec leurs
horaires et leur état d'ouverture.

> À dire : « Un visiteur peut consulter les menus sans compte, comme le demande
> le cahier des charges §4.2. »

Basculer le **mode sombre** depuis l'en-tête : toute l'interface suit.

### Étape 2 — Le client commande (2 min)

1. « Voir le menu du jour » → page Menus.
2. Montrer les **puces de catégories** et le bandeau du restaurant.
3. Ajouter deux plats : le message « ajouté au panier » apparaît, la pastille du
   panier s'incrémente.
4. Ouvrir le panier, ajuster une quantité, « Passer la commande ».
5. Se connecter en `client@saes.sn` si demandé, puis valider.
6. Aller dans « Mes commandes » : la **frise** montre *Reçue → En préparation →
   Prête*. La commande est « Reçue ».

> À dire : « Le prix retenu est celui du moment où le plat entre dans la
> commande (règle 4), et la commande serait refusée si le restaurant était
> fermé. »

### Étape 3 — Le serveur prend une commande sur place (1 min)

Se connecter en `serveur@saes.sn`.

1. « Prendre une commande » : choisir *Sur place*, une table, deux plats.
2. Enregistrer.
3. Aller sur « Visualiser l'occupation des tables » : le **plan de salle** montre
   la table passée en « Occupée », avec ses couverts dessinés, les places
   libres restantes et les réservations du jour.

### Étape 4 — La cuisine prépare (2 min)

Se connecter en `cuisinier@saes.sn`.

1. L'écran est organisé en deux colonnes : **À démarrer** et **En préparation**,
   les deux seuls statuts que voit la cuisine.
2. Chaque commande affiche son **temps d'attente**, qui passe en orange puis en
   rouge quand elle traîne.
3. « Démarrer la préparation » sur la commande du client.

> **Le moment technique.** Avant de cliquer, ouvrir la page des stocks du gérant
> dans l'autre fenêtre et noter le stock d'un ingrédient du plat. Après le clic,
> recharger : le stock a baissé de la quantité prévue par la recette.
> « Le changement de statut et la sortie de stock sont dans la même transaction :
> les deux se font, ou aucun des deux. »

4. « Terminer la préparation » : la commande devient « Prête ».
5. Côté client, recharger « Mes commandes » : la frise a avancé.

### Étape 5 — La caisse encaisse (1 min 30)

Se connecter en `caissier@saes.sn`.

1. Si la caisse n'est pas ouverte : « Ouvrir la caisse », fond de 20 000 FCFA.
2. « Encaisser une commande » : la commande prête apparaît, avec son temps
   d'attente. La choisir.
3. Choisir **Espèces**, encaisser, confirmer.
4. « Clôturer la caisse » : saisir un montant compté **volontairement faux**
   (par exemple 1 000 FCFA de moins) et montrer l'**écart** calculé.

### Étape 6 — Une réservation (1 min)

Revenir côté client.

1. « Réserver une table » : une date, une heure, 6 couverts.
2. La plateforme **choisit elle-même les tables**.

> **Le second moment technique.** « Les tables sont choisies pour laisser le
> moins de places inutilisées, puis le moins de tables possible (règle 7). Deux
> réservations confirmées ne partagent jamais une table sur des créneaux qui se
> chevauchent : c'est garanti par une contrainte d'exclusion de PostgreSQL, pas
> seulement par du code. »

Pour l'illustrer : tenter une réservation qui dépasse la capacité restante sur
le même créneau → elle est refusée, avec le motif.

### Étape 7 — Le gérant pilote (3 min)

Se connecter en `gerant@saes.sn`.

1. **Statistiques de ventes** : les chiffres clés, la répartition par catégorie
   (anneau), les plats les plus vendus (barres), puis le détail chiffré.
   Changer la période : tout se recalcule.
2. **Rapports financiers** : les encaissements jour par jour en barres empilées
   (espèces / Mobile Money), la répartition par mode de paiement, les écarts de
   caisse — dont celui qu'on vient de créer à l'étape 5.
3. **Stocks** : le bandeau rouge signale les ingrédients sous leur seuil
   d'alerte ; chaque ligne porte une jauge *stock / niveau cible* avec le repère
   du seuil.
4. **Recommandations d'approvisionnement** : la quantité à commander, calculée
   par la règle du cahier des charges (niveau cible − stock), avec la
   consommation moyenne des 28 derniers jours.

> À dire : « Ce sont des recommandations calculées par une règle, pas de
> l'intelligence artificielle : c'est exactement ce que demande le cahier des
> charges. »

5. **Déclarer une commande abandonnée** : montrer l'écran, expliquer que le
   montant remonte dans les rapports financiers.

### Étape 8 — L'administration (1 min 30)

Se connecter en `admin@saes.sn`.

1. **Comptes utilisateurs** : les rôles, les comptes actifs et désactivés.
   Montrer qu'un administrateur **ne peut pas** se retirer son propre rôle.
2. **Restaurants** : les tables, les plages d'ouverture par jour.
3. **Historique des opérations** : la trace de ce qui vient d'être fait pendant
   la démonstration.

### Étape 9 — Le téléphone (30 s)

Réduire la fenêtre à la largeur d'un téléphone, ou ouvrir sur un vrai mobile.

Montrer : la page d'accueil, le menu, le panier, puis l'écran des comptes de
l'administration, où **le tableau devient une pile de cartes**.

---

## 3. Les points techniques à mettre en avant

| Point | Où le montrer |
| --- | --- |
| Attribution automatique des tables | Étape 6, réservation de 6 couverts |
| Prévention des conflits de réservation | Étape 6, réservation refusée |
| Transaction atomique statut + stock | Étape 4, « Démarrer la préparation » |
| Gestion de la concurrence | Deux onglets sur la même commande : la seconde action est refusée et l'écran se remet à jour |
| Contrôle des accès | Ouvrir `/admin/utilisateurs` en étant connecté comme serveur |
| Isolation des restaurants | Le gérant du Baobab ne voit que ses plats |
| Stock piloté par les recettes | Étape 4 |
| Traçabilité financière | Étape 5 puis étape 7 : commande → paiement → session de caisse → rapport |

## 4. Questions probables, réponses courtes

- **« Pourquoi pas de paiement en ligne ? »** Le cahier des charges l'exclut
  (limite 4) : une commande en ligne se règle à la caisse, au retrait.
- **« Où est l'intelligence artificielle ? »** Le cahier des charges précise que
  les « recommandations intelligentes » sont une règle de calcul sur le stock
  suivi par la plateforme, sans IA.
- **« Et les jours fériés ? »** Hors périmètre (limite 1) : la plateforme ne
  connaît que les horaires habituels de la semaine.
- **« Les données sont-elles réalistes ? »** Elles sont générées par
  `DataSeeder`, uniquement avec le profil `dev`, à partir d'une graine fixe :
  dix semaines de commandes, de paiements, de caisses et de mouvements de stock
  qui respectent toutes les règles métier. La production ne reçoit rien.

## 5. Plan B

| Problème | Solution |
| --- | --- |
| Le backend ne démarre pas | Vérifier que PostgreSQL tourne (`docker compose up -d db`) |
| La base est vide | Le jeu n'est inséré que si la base l'est : supprimer et recréer la base, puis relancer |
| Pas de commande prête à encaisser | En créer une : serveur → cuisine → démarrer → terminer |
| Le réseau manque | Tout tourne en local ; seules les polices Google et le bouton Google ont besoin d'Internet, et la page reste lisible sans eux |
