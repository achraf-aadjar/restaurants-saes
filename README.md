# restaurants-saes

Application SAES Restaurants : API Spring Boot + interface Angular.

## Structure

```
restaurants-saes/
├── saes-backend/    API REST — Spring Boot 4.1.2, Java 21, Maven
└── saes-frontend/   Interface — Angular 22, SCSS, routing
```

## Prerequis

| Outil  | Version    | Verification        |
| ------ | ---------- | ------------------- |
| JDK    | 21         | `java -version`     |
| Maven  | 3.9+       | `mvn -v` (ou `./mvnw`) |
| Node   | 24         | `nvm use` dans `saes-frontend` |

## Lancer en developpement

Deux terminaux.

**Terminal 1 — backend (port 8080)**

```bash
cd saes-backend
./mvnw spring-boot:run
```

**Terminal 2 — frontend (port 4200)**

```bash
cd saes-frontend
nvm use          # bascule sur Node 24 (lit .nvmrc)
npm start
```

Ouvrir http://localhost:4200 et cliquer sur « Tester /api/ping » : la liaison
front/back doit s'afficher en vert.

## Backend — saes-backend

- Package racine : `com.saes.backend`
- Base de developpement : H2 en memoire, console sur http://localhost:8080/h2-console
  (JDBC URL `jdbc:h2:mem:saes`, user `sa`, pas de mot de passe)
- CORS : `http://localhost:4200` autorise sur `/api/**` (`saes.cors.allowed-origins`)
- Endpoints de controle : `GET /api/ping`, `GET /actuator/health`

Commandes :

```bash
./mvnw spring-boot:run     # demarrer
./mvnw test                # tests
./mvnw clean package       # jar dans target/
```

### Passer sur PostgreSQL

Le driver est deja dans le pom et le profil `postgres` est pret :

```bash
createdb saes
DB_USER=postgres DB_PASSWORD=postgres \
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres
```

## Frontend — saes-frontend

- Les appels HTTP utilisent des URLs **relatives** (`/api/...`). Le proxy de
  developpement (`proxy.conf.json`) redirige `/api` vers `http://localhost:8080`,
  donc aucune URL absolue a changer entre dev et prod.
- `src/app/core/api.service.ts` centralise les appels a l'API.
- `src/app/home/` est la page d'accueil, branchee sur la route `''`.

Commandes :

```bash
npm start                  # serveur de dev + proxy
npm run build              # build de production dans dist/
npm test                   # tests unitaires (Vitest)
ng generate component nom  # nouveau composant
```
