-- Gerer les restaurants (cahier des charges §4.7) : le telephone fait partie
-- des informations du restaurant, montrees aux clients avec son nom et son
-- adresse. Il devient obligatoire. Si un restaurant n'en a pas encore, cette
-- migration echoue sans rien changer : il faut d'abord le renseigner.
alter table restaurant alter column telephone set not null;
