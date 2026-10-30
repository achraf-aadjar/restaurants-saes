-- Schema initial : les 14 classes du modele du domaine
-- (support_comprehension_conception.pdf, diagramme de classes)
--
-- Convention : les enumerations du modele sont stockees en VARCHAR avec une
-- contrainte CHECK plutot qu'en type enum Postgres, pour rester simple a
-- faire evoluer avec Flyway.

create extension if not exists btree_gist;

-- ===================== Organisation (Restaurant, Table, HoraireOuverture) ==

create table restaurant (
    id                 bigserial primary key,
    nom                varchar(150) not null,
    adresse            varchar(255) not null,
    telephone          varchar(30),
    duree_reservation_minutes integer not null check (duree_reservation_minutes > 0),
    est_actif          boolean not null default true
);

create table restaurant_table (
    id            bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    numero        integer not null,
    capacite      integer not null check (capacite > 0),
    unique (restaurant_id, numero)
);

create table horaire_ouverture (
    id               bigserial primary key,
    restaurant_id    bigint not null references restaurant(id),
    jour             varchar(10) not null
        check (jour in ('LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI','DIMANCHE')),
    heure_ouverture  time not null,
    heure_fermeture  time not null,
    check (heure_fermeture > heure_ouverture)
);

-- ===================== Utilisateur =========================================

create table utilisateur (
    id            bigserial primary key,
    nom           varchar(100) not null,
    prenom        varchar(100) not null,
    email         varchar(255) not null unique,
    mot_de_passe  varchar(255) not null,
    telephone     varchar(30),
    restaurant_id bigint references restaurant(id),
    est_actif     boolean not null default true
);

create table utilisateur_role (
    utilisateur_id bigint not null references utilisateur(id) on delete cascade,
    role           varchar(20) not null
        check (role in ('CLIENT','SERVEUR','CUISINIER','CAISSIER','GERANT','ADMINISTRATEUR')),
    primary key (utilisateur_id, role)
);

-- ===================== Carte (Plat, Menu, Ingredient, Recette) =============

create table ingredient (
    id            bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    nom           varchar(150) not null,
    unite         varchar(15) not null
        check (unite in ('GRAMME','KILOGRAMME','MILLILITRE','LITRE','PIECE')),
    seuil_alerte  numeric(12,3) not null check (seuil_alerte >= 0),
    niveau_cible  numeric(12,3) not null check (niveau_cible >= 0),
    unique (restaurant_id, nom),
    check (niveau_cible >= seuil_alerte)
);

create table plat (
    id            bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    nom           varchar(150) not null,
    description   varchar(1000),
    prix          integer not null check (prix >= 0),
    categorie     varchar(20) not null
        check (categorie in ('ENTREE','PLAT_PRINCIPAL','DESSERT','BOISSON')),
    est_actif     boolean not null default true
);

create table recette (
    plat_id              bigint not null references plat(id) on delete cascade,
    ingredient_id        bigint not null references ingredient(id),
    quantite_necessaire  numeric(12,3) not null check (quantite_necessaire > 0),
    primary key (plat_id, ingredient_id)
);

create table menu (
    id            bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    nom           varchar(150) not null,
    date_debut    date not null,
    date_fin      date,
    check (date_fin is null or date_fin >= date_debut)
);

create table menu_plat (
    menu_id bigint not null references menu(id) on delete cascade,
    plat_id bigint not null references plat(id),
    primary key (menu_id, plat_id)
);

-- ===================== Stock (MouvementStock) ===============================

create table mouvement_stock (
    id            bigserial primary key,
    ingredient_id bigint not null references ingredient(id),
    type          varchar(10) not null check (type in ('ENTREE','SORTIE')),
    quantite      numeric(12,3) not null check (quantite > 0),
    date_heure    timestamp not null default now()
);

-- ===================== Service (Commande, LigneCommande, Reservation) ======

create table commande (
    id            bigserial primary key,
    restaurant_id bigint not null references restaurant(id),
    client_id     bigint references utilisateur(id),
    serveur_id    bigint references utilisateur(id),
    table_id      bigint references restaurant_table(id),
    type          varchar(15) not null check (type in ('SUR_PLACE','A_EMPORTER')),
    statut        varchar(20) not null
        check (statut in ('EN_ATTENTE','EN_PREPARATION','PRETE','PAYEE','ANNULEE','ABANDONNEE')),
    date_heure    timestamp not null default now(),
    version       bigint not null default 0,
    check (client_id is not null or serveur_id is not null)
);

create table ligne_commande (
    id             bigserial primary key,
    commande_id    bigint not null references commande(id) on delete cascade,
    plat_id        bigint not null references plat(id),
    quantite       integer not null check (quantite > 0),
    prix_unitaire  integer not null check (prix_unitaire >= 0)
);

create table reservation (
    id               bigserial primary key,
    restaurant_id    bigint not null references restaurant(id),
    client_id        bigint not null references utilisateur(id),
    date_heure       timestamp not null,
    duree_minutes    integer not null check (duree_minutes > 0),
    nombre_couverts  integer not null check (nombre_couverts > 0),
    statut           varchar(15) not null check (statut in ('CONFIRMEE','ANNULEE'))
);

-- Classe-association Reservation <-> Table. Le creneau (bornes) et le statut
-- y sont recopies pour porter la contrainte d'exclusion
-- (choix_techniques_architecture.pdf §3 ; regle 8 du cahier des charges :
-- deux reservations confirmees ne portent jamais sur la meme table pour des
-- creneaux qui se chevauchent). Le creneau est stocke en deux colonnes
-- timestamp (plus simple a mapper en JPA qu'un tsrange) ; l'exclusion
-- s'appuie sur l'expression tsrange(heure_debut, heure_fin), fin exclue.
create table reservation_table (
    reservation_id bigint not null references reservation(id) on delete cascade,
    table_id       bigint not null references restaurant_table(id),
    heure_debut    timestamp not null,
    heure_fin      timestamp not null,
    statut         varchar(15) not null check (statut in ('CONFIRMEE','ANNULEE')),
    primary key (reservation_id, table_id),
    check (heure_fin > heure_debut),
    exclude using gist (
        table_id with =,
        tsrange(heure_debut, heure_fin, '[)') with &&
    ) where (statut = 'CONFIRMEE')
);

-- ===================== Argent (Paiement, SessionCaisse) =====================

create table session_caisse (
    id                     bigserial primary key,
    caissier_id            bigint not null references utilisateur(id),
    date_heure_ouverture   timestamp not null default now(),
    fond_de_caisse         integer not null check (fond_de_caisse >= 0),
    date_heure_cloture     timestamp,
    montant_compte         integer
);

create table paiement (
    id                 bigserial primary key,
    commande_id        bigint not null unique references commande(id),
    session_caisse_id  bigint not null references session_caisse(id),
    mode_paiement      varchar(15) not null check (mode_paiement in ('ESPECES','MOBILE_MONEY')),
    date_heure         timestamp not null default now()
);

-- ===================== Index utiles =========================================

create index idx_commande_restaurant_statut on commande (restaurant_id, statut);
create index idx_reservation_restaurant_date on reservation (restaurant_id, date_heure);
create index idx_mouvement_stock_ingredient on mouvement_stock (ingredient_id);
create index idx_plat_restaurant on plat (restaurant_id);
create index idx_menu_restaurant on menu (restaurant_id);
