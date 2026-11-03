-- Ouvrir la caisse (cahier des charges §4.5) est refuse si le caissier a deja
-- une caisse ouverte. Le service le verifie, mais deux demandes simultanees
-- pouvaient toutes deux passer cette verification : la base le garantit
-- desormais elle-meme, quel que soit l'ordre des requetes.
create unique index session_caisse_une_ouverte_par_caissier
    on session_caisse (caissier_id)
    where date_heure_cloture is null;
