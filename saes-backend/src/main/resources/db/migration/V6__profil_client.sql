-- A l'inscription, on demande si la personne est etudiante ou professeure :
-- des abonnements existent pour chacune. Ecart assume au cahier des charges
-- (§4.1 ne cite que nom, prenom, e-mail, mot de passe et telephone).
--
-- Le profil est facultatif en base : le personnel, l'administrateur, les comptes
-- crees avant cette migration et les comptes Google crees a la connexion n'en
-- ont pas encore. Un client le renseigne dans « Mon compte ».
alter table utilisateur add column profil varchar(20);
alter table utilisateur add constraint utilisateur_profil_valide
    check (profil is null or profil in ('ETUDIANT', 'PROFESSEUR'));
