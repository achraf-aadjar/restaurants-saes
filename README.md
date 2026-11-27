# restaurants-saes

Plateforme de gestion des restaurants du SAES de Thiès (sujet 17, DIC1) :
API Spring Boot, interface Angular, base PostgreSQL.

## Structure

```
restaurants-saes/
├── saes-backend/    API REST — Spring Boot 4.1, Java 21, Maven
└── saes-frontend/   Interface — Angular 22, Chart.js 4
```

## Prérequis

| Outil      | Version | Vérification                    |
| ---------- | ------- | ------------------------------- |
| JDK        | 21      | `java -version`                 |
| Node       | 24      | `node -v` (voir `saes-frontend/.nvmrc`) |
| PostgreSQL | 18      | installé sur le PC, port 5432   |

Maven n'a pas besoin d'être installé : le dépôt fournit `mvnw`.

## Mise en place (une seule fois)

1. **Créer la base** `saes` dans pgAdmin (Databases → Create → Database).
2. **Donner le mot de passe de PostgreSQL au backend** par une variable
   d'environnement `DB_PASSWORD` (jamais dans le dépôt, qui est public).
   Sous Windows : « Modifier les variables d'environnement pour votre compte »
   → Nouvelle → nom `DB_PASSWORD`, valeur : le mot de passe choisi à
   l'installation de PostgreSQL. Fermer et rouvrir VS Code ensuite.
   (L'utilisateur est `postgres` par défaut ; sinon, définir aussi `DB_USER`.)
3. **Installer les dépendances du frontend** :

   ```bash
   cd saes-frontend
   npm install
   ```

`docker-compose.yml` est une autre façon d'obtenir PostgreSQL ; elle n'est pas
utilisée pour l'instant.

## Lancer en développement

Deux terminaux.

**Terminal 1 — backend (port 8080), avec le profil `dev`**

```powershell
cd saes-backend
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

(Sous macOS ou Linux : `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`.)

Le profil `dev` fournit une clé de jeton de développement et, **si la base est
vide**, la remplit avec le jeu de démonstration (`config/DataSeeder.java`) :
le restaurant de l'EPT avec ses tables et ses horaires, 21 comptes (un par rôle,
plus du personnel et des clients), 28 plats avec leur recette, 4 menus, et dix
semaines d'activité — 750 commandes, leurs paiements, 51 sessions de caisse,
4 000 mouvements de stock et 40 réservations. Le tirage part d'une graine fixe :
le jeu est le même sur toutes les installations.

Il ne crée **qu'un seul restaurant** : c'est à l'administrateur d'en ajouter
d'autres depuis son écran (« Choisir un restaurant », puis « Ajouter un
restaurant »).

Ce jeu n'existe qu'avec le profil `dev` ; la production ne reçoit rien.

Comme il n'est inséré que si la base est vide, une base déjà remplie garde son
contenu. Pour repartir du jeu complet (**cela efface les données de la base de
développement**) :

```bash
docker exec saes-postgres psql -U postgres -c "DROP DATABASE saes;" -c "CREATE DATABASE saes;"
```

**Terminal 2 — frontend (port 4200)**

```bash
cd saes-frontend
npm start
```

Ouvrir http://localhost:4200. Le proxy de développement (`proxy.conf.json`)
envoie les appels `/api` au backend.

**Comptes de test** : `admin@saes.sn`, `gerant@saes.sn`, `caissier@saes.sn`,
`cuisinier@saes.sn`, `serveur@saes.sn`, `client@saes.sn`. Leur mot de passe est
la constante `MOT_DE_PASSE` de `saes-backend/.../config/DataSeeder.java`.

## Base de données

Le schéma est créé par Flyway (`saes-backend/src/main/resources/db/migration`).
**On ne modifie jamais une migration déjà appliquée** : Flyway garde son
empreinte et le serveur refuserait de démarrer. Pour changer le schéma, on
ajoute un nouveau fichier `V<n>__description.sql`.

## Commandes utiles

```bash
# backend (dans saes-backend)
.\mvnw test                 # 87 tests sur une PostgreSQL jetable (Docker doit tourner)
.\mvnw clean package        # jar dans target/

# frontend (dans saes-frontend)
npm test                    # tests unitaires (Vitest)
npm run build               # build de production dans dist/
npx prettier --write src    # formatage automatique
```

## Design

Toutes les couleurs, les échelles et les ombres sont des variables CSS groupées
en tête de `saes-frontend/src/styles.scss`, en deux thèmes complets (clair et
sombre). Aucun composant n'écrit une couleur en dur : changer l'identité
visuelle se fait à un seul endroit.

Le détail du chantier de refonte, la matrice de conformité au cahier des
charges et ce qui reste à faire sont dans [REFONTE_PLAN.md](REFONTE_PLAN.md).
Le scénario de soutenance est dans [DEMO_JURY.md](DEMO_JURY.md).

**Netteté des photos** : une photo n'est jamais étirée en fond de page. Un écran
Retina affiche deux fois plus de pixels que de pixels CSS : une photo de 800 px
de large ne reste nette que dans un cadre d'environ 400 px, et une de 1280 px
dans un cadre d'environ 640 px. Pour une photo plein écran, il faut une source
d'au moins 2400 px de large.

**Photos de la vitrine** : les pages « Accueil » et « Photos » utilisent les
photos listées dans `saes-frontend/src/app/core/photos-site.ts`. Pour mettre les
vôtres, déposer les fichiers `.webp` dans `saes-frontend/public/assets/site/` et
les ajouter à ce fichier, avec une légende.

**Photos des plats** : six plats en ont une. Pour en ajouter, déposer
`saes-frontend/public/assets/plats/<nom-du-plat>-360.webp` et `-720.webp`
(ratio 9:10), puis ajouter le nom dans
`saes-frontend/src/app/core/photos-plats.ts`. Un plat sans photo affiche
l'icône de sa catégorie.

## Déploiement (HTTPS)

Tout tient dans `docker-compose.prod.yml` : PostgreSQL 16 (volume persistant,
non exposée), le backend (profil `prod`, sans données de test) et le site
Angular servi par **Caddy**, qui obtient seul le certificat HTTPS (Let's
Encrypt), redirige HTTP vers HTTPS et transmet `/api` au backend. Seuls les
ports 80 et 443 sont ouverts.

1. Sur le serveur (Docker installé), faire pointer le nom de domaine vers son
   adresse IP et ouvrir les ports 80 et 443.
2. Copier `.env.example` en `.env` et le remplir (domaine, mot de passe de la
   base, `SAES_JWT_SECRET` d'au moins 32 caractères, premier administrateur).
   **`.env` ne doit jamais être commité** (il est dans `.gitignore`).
3. Lancer :

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   ```

   Le premier administrateur est créé au démarrage s'il n'en existe aucun ;
   retirer ensuite `SAES_ADMIN_EMAIL` et `SAES_ADMIN_MOT_DE_PASSE` de `.env`.
4. Connexion Google : ajouter `https://<domaine>` aux « Origines JavaScript
   autorisées » du Client ID dans Google Cloud Console.

**Sauvegardes** : `scripts/sauvegarder-base.sh` écrit
`sauvegardes/saes-<date>.sql.gz` et garde les 14 plus récentes ; à planifier
chaque nuit (la commande de restauration est en tête du script).

Pour essayer en local : `SAES_DOMAINE=localhost` dans `.env`, puis
https://localhost (certificat local, à accepter dans le navigateur).
