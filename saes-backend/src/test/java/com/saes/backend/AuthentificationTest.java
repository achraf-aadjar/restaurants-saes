package com.saes.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.domain.Utilisateur;
import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** S'inscrire, S'authentifier (cahier des charges §4.1) et jetons de connexion. */
class AuthentificationTest extends IntegrationTest {

    private Map<String, Object> inscription(String email) {
        return Map.of("nom", "Fall", "prenom", "Binta", "email", email, "motDePasse", Monde.MOT_DE_PASSE);
    }

    @Test
    void sInscrireCreeUnCompteClientAvecMotDePasseHache() {
        String email = "inscription-" + System.nanoTime() + "@test.sn";

        Reponse reponse = api.post(null, "/api/auth/register", inscription(email));

        assertThat(reponse.statut()).isEqualTo(201);
        assertThat(reponse.<String>lire("$.token")).isNotBlank();
        assertThat(reponse.liste("$.utilisateur.roles")).containsExactly("CLIENT");
        Utilisateur enBase = utilisateurRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertThat(enBase.getMotDePasse()).isNotEqualTo(Monde.MOT_DE_PASSE);
        assertThat(passwordEncoder.matches(Monde.MOT_DE_PASSE, enBase.getMotDePasse())).isTrue();
    }

    @Test
    void sInscrireEstRefuseSiLAdresseEstDejaUtilisee() {
        String email = "doublon-" + System.nanoTime() + "@test.sn";
        assertThat(api.post(null, "/api/auth/register", inscription(email)).statut()).isEqualTo(201);

        Reponse doublon = api.post(null, "/api/auth/register", inscription(email.toUpperCase()));

        assertThat(doublon.statut()).isEqualTo(409);
    }

    @Test
    void sInscrireRefuseUnMotDePasseTropCourt() {
        Reponse reponse = api.post(null, "/api/auth/register", Map.of(
                "nom", "Fall", "prenom", "Binta", "email", "court-" + System.nanoTime() + "@test.sn",
                "motDePasse", "1234567"));

        assertThat(reponse.statut()).isEqualTo(400);
    }

    @Test
    void sAuthentifierRefuseUnMauvaisMotDePasse() {
        String email = "connexion-" + System.nanoTime() + "@test.sn";
        api.post(null, "/api/auth/register", inscription(email));

        Reponse reponse = api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", "mauvais-mot"));

        assertThat(reponse.statut()).isEqualTo(401);
    }

    @Test
    void unCompteDesactiveNePeutPlusSeConnecterNiUtiliserSonJeton() {
        String email = "desactive-" + System.nanoTime() + "@test.sn";
        Reponse inscription = api.post(null, "/api/auth/register", inscription(email));
        String jeton = inscription.lire("$.token");
        long id = inscription.entier("$.utilisateur.id");

        assertThat(api.put(monde.jetonAdmin, "/api/admin/users/" + id + "/desactiver", null).statut()).isEqualTo(200);

        assertThat(api.post(null, "/api/auth/login", Map.of("email", email, "motDePasse", Monde.MOT_DE_PASSE))
                .statut()).isEqualTo(401);
        assertThat(api.get(jeton, "/api/me").statut()).isEqualTo(401);
    }

    @Test
    void sansJetonLesFonctionsConnecteesRepondent401() {
        assertThat(api.get(null, "/api/me").statut()).isEqualTo(401);
        assertThat(api.get(null, "/api/commandes").statut()).isEqualTo(401);
        assertThat(api.get(null, "/api/gerant/plats").statut()).isEqualTo(401);
    }

    @Test
    void consulterLesMenusEstPossibleSansCompte() {
        assertThat(api.get(null, "/api/public/restaurants").statut()).isEqualTo(200);
        assertThat(api.get(null, "/api/public/restaurants/" + monde.restaurantId + "/menus").statut()).isEqualTo(200);
    }

    @Test
    void unJetonInvalideFalsifieOuExpireEstRefuse() {
        long clientId = api.get(monde.jetonClient, "/api/me").entier("$.id");
        var bonneCle = Keys.hmacShaKeyFor(SECRET_JWT.getBytes(StandardCharsets.UTF_8));
        var autreCle = Keys.hmacShaKeyFor("une-autre-cle-de-signature-de-32-caracteres".getBytes(StandardCharsets.UTF_8));
        Date ilYAUneHeure = new Date(System.currentTimeMillis() - 3_600_000);

        String expire = Jwts.builder().subject(String.valueOf(clientId))
                .issuedAt(new Date(ilYAUneHeure.getTime() - 60_000)).expiration(ilYAUneHeure)
                .signWith(bonneCle).compact();
        String falsifie = Jwts.builder().subject(String.valueOf(clientId))
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(autreCle).compact();

        assertThat(api.get("pas-un-jeton", "/api/me").statut()).isEqualTo(401);
        assertThat(api.get(expire, "/api/me").statut()).isEqualTo(401);
        assertThat(api.get(falsifie, "/api/me").statut()).isEqualTo(401);
        assertThat(api.get(monde.jetonClient, "/api/me").statut()).isEqualTo(200);
    }

    @Test
    void connexionGoogleRefuseUnJetonQueGoogleNAPasSigne() {
        Reponse reponse = api.post(null, "/api/auth/google", Map.of("idToken", "faux-jeton"));

        assertThat(reponse.statut()).isEqualTo(400);
    }
}
