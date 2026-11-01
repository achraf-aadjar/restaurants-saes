-- Contrainte 10 de la conception : les prix sont > 0 (V1 acceptait 0) et le
-- montant compte a la cloture de la caisse est >= 0 (V1 ne le verifiait pas).
--
-- On ne modifie jamais V1 : Flyway garde son empreinte et refuserait de
-- demarrer. Les anciennes contraintes portent le nom que PostgreSQL leur a
-- donne par defaut (table_colonne_check).

alter table plat drop constraint if exists plat_prix_check;
alter table plat add constraint plat_prix_positif check (prix > 0);

alter table ligne_commande drop constraint if exists ligne_commande_prix_unitaire_check;
alter table ligne_commande add constraint ligne_commande_prix_unitaire_positif check (prix_unitaire > 0);

alter table session_caisse add constraint session_caisse_montant_compte_positif check (montant_compte >= 0);
