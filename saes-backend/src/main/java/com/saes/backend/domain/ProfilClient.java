package com.saes.backend.domain;

/**
 * Profil d'un client, demande a l'inscription : des abonnements existent pour
 * les etudiants et pour les professeurs. Ce n'est pas un role : il ne change
 * aucun droit d'acces.
 */
public enum ProfilClient {
    ETUDIANT,
    PROFESSEUR
}
