# restaurants-saes

Plateforme de gestion des restaurants du SAES de Thiès (sujet 17, DIC1) :
API Spring Boot, interface Angular, base PostgreSQL.

## Structure

```
restaurants-saes/
├── saes-backend/    API REST — Spring Boot 4.1, Java 21, Maven
└── saes-frontend/   Interface — Angular 22
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

Le profil `dev` fournit une clé de jeton de développement et, si la base est
vide, la remplit avec les données de test : un restaurant avec ses tables et
ses horaires, un compte par rôle, des ingrédients, des plats, un menu et des
commandes dans chaque statut.

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
.\mvnw test                 # tests (PostgreSQL doit être démarré)
.\mvnw clean package        # jar dans target/

# frontend (dans saes-frontend)
npm test                    # tests unitaires (Vitest)
npm run build               # build de production dans dist/
npx prettier --write src    # formatage automatique
```

## Production

La variable d'environnement `SAES_JWT_SECRET` (au moins 32 caractères) est
obligatoire : sans elle, le backend refuse de démarrer.
