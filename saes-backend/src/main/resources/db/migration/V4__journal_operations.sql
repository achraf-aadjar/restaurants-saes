-- Historique des operations sensibles (caisse, annulations, abandons, ruptures,
-- administration) : qui, quoi, quand, sur quel objet. Chaque entree est ecrite
-- dans la meme transaction que l'operation. Aucun mot de passe ni jeton n'y
-- figure ; les entrees ne sont jamais modifiees.
create table journal_operation (
    id          bigserial primary key,
    date_heure  timestamptz not null default now(),
    acteur_id   bigint references utilisateur(id),
    action      varchar(40) not null,
    objet_type  varchar(30) not null,
    objet_id    bigint,
    details     varchar(500)
);

create index journal_operation_date_heure on journal_operation (date_heure desc);
