package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.saes.backend.support.Api.Reponse;
import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.Monde;

/**
 * Reservations (cahier des charges §4.4) et regles 6 a 9. Le restaurant du
 * monde de test a trois tables de 2, 4 et 6 places et une duree de
 * reservation de 90 minutes.
 */
class ReservationsTest extends IntegrationTest {

    private static final LocalDateTime DEMAIN_MIDI = LocalDate.now().plusDays(1).atTime(12, 0);

    @Autowired
    private JdbcTemplate jdbc;

    private Reponse reserver(String jeton, LocalDateTime quand, int couverts) {
        return api.post(jeton, "/api/reservations", Map.of(
                "restaurantId", monde.restaurantId, "dateHeure", quand.toString(), "nombreCouverts", couverts));
    }

    private List<Object> numerosDesTables(Reponse reservation) {
        return reservation.liste("$.tables[*].numero");
    }

    @Test
    void regle7LaPlateformeChoisitLesTablesQuiLaissentLeMoinsDePlacesInutilisees() {
        assertThat(numerosDesTables(ok(reserver(monde.jetonClient, DEMAIN_MIDI, 3)))).containsExactly(2);
        assertThat(numerosDesTables(ok(reserver(monde.jetonClient, DEMAIN_MIDI.plusDays(1), 5)))).containsExactly(3);
        assertThat(numerosDesTables(ok(reserver(monde.jetonClient, DEMAIN_MIDI.plusDays(2), 7))))
                .containsExactlyInAnyOrder(1, 3);
    }

    @Test
    void regle7AEgaliteDePlacesInutiliseesLeMoinsDeTables() {
        // 6 couverts : la table de 6 (0 place libre) plutot que 2 + 4 (0 place libre aussi, mais 2 tables).
        Reponse reservation = ok(reserver(monde.jetonClient, DEMAIN_MIDI, 6));

        assertThat(numerosDesTables(reservation)).containsExactly(3);
        assertThat(reservation.entier("$.dureeMinutes")).isEqualTo(90);
        assertThat(reservation.<String>lire("$.statut")).isEqualTo("CONFIRMEE");
    }

    @Test
    void reserverEstRefuseQuandLesTablesNOffrentPasAssezDePlaces() {
        assertThat(reserver(monde.jetonClient, DEMAIN_MIDI, 13).statut()).isEqualTo(409);
    }

    @Test
    void leCreneauDoitEtreEntierementDansLesHorairesLHeureDeFinNEnFaisantPasPartie() {
        Map<String, Object> restaurant = Monde.requeteRestaurant("Ouvert 08:00 - 22:00");
        List<Map<String, Object>> horaires = new ArrayList<>();
        for (String jour : List.of("LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE")) {
            horaires.add(Map.of("jour", jour, "heureOuverture", "08:00:00", "heureFermeture", "22:00:00"));
        }
        restaurant.put("horaires", horaires);
        restaurant.put("tables", tablesExistantes());
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId, restaurant));
        LocalDate demain = LocalDate.now().plusDays(1);

        assertThat(reserver(monde.jetonClient, demain.atTime(20, 30), 2).statut()).isEqualTo(201);
        assertThat(reserver(monde.jetonClient, demain.atTime(21, 0), 2).statut()).isEqualTo(409);
        assertThat(reserver(monde.jetonClient, demain.atTime(7, 30), 2).statut()).isEqualTo(409);
    }

    @Test
    void unCreneauQuiTientDansDeuxPlagesColleesEstDansLesHoraires() {
        LocalDate demain = LocalDate.now().plusDays(1);

        // 12:00 - 14:00 et 14:00 - 16:00 : le restaurant est ouvert sans interruption de 12:00 a 16:00.
        changerHoraires("12:00:00", "14:00:00", "14:00:00", "16:00:00");
        assertThat(reserver(monde.jetonClient, demain.atTime(13, 30), 2).statut()).isEqualTo(201);

        // 12:00 - 14:00 et 14:30 - 16:00 : le restaurant est ferme de 14:00 a 14:30.
        changerHoraires("12:00:00", "14:00:00", "14:30:00", "16:00:00");
        assertThat(reserver(monde.jetonClient, demain.plusDays(1).atTime(13, 30), 2).statut()).isEqualTo(409);
    }

    /** Deux plages chaque jour de la semaine. */
    private void changerHoraires(String ouverture1, String fermeture1, String ouverture2, String fermeture2) {
        Map<String, Object> restaurant = Monde.requeteRestaurant("Deux plages par jour");
        List<Map<String, Object>> horaires = new ArrayList<>();
        for (String jour : List.of("LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE")) {
            horaires.add(Map.of("jour", jour, "heureOuverture", ouverture1, "heureFermeture", fermeture1));
            horaires.add(Map.of("jour", jour, "heureOuverture", ouverture2, "heureFermeture", fermeture2));
        }
        restaurant.put("horaires", horaires);
        restaurant.put("tables", tablesExistantes());
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId, restaurant));
    }

    @Test
    void unCreneauQuiDepasseMinuitNEstPasDansLesHorairesDUnSeulJour() {
        assertThat(reserver(monde.jetonClient, LocalDate.now().plusDays(1).atTime(23, 0), 2).statut()).isEqualTo(409);
    }

    @Test
    void regle8LesTablesReserveesNeSontPlusProposeesSurUnCreneauQuiChevauche() {
        ok(reserver(monde.jetonClient, DEMAIN_MIDI, 6));

        Reponse chevauchante = ok(reserver(monde.nouveauClient(), DEMAIN_MIDI.plusMinutes(30), 6));
        assertThat(numerosDesTables(chevauchante)).containsExactlyInAnyOrder(1, 2);

        assertThat(reserver(monde.nouveauClient(), DEMAIN_MIDI.plusMinutes(30), 2).statut()).isEqualTo(409);
    }

    @Test
    void lHeureDeFinNeFaitPasPartieDuCreneau() {
        ok(reserver(monde.jetonClient, DEMAIN_MIDI, 6));

        Reponse suivante = reserver(monde.nouveauClient(), DEMAIN_MIDI.plusMinutes(90), 6);

        assertThat(suivante.statut()).isEqualTo(201);
        assertThat(numerosDesTables(suivante)).containsExactly(3);
    }

    @Test
    void annulerUneReservationLibereSesTablesSurCeCreneau() {
        long premiere = ok(reserver(monde.jetonClient, DEMAIN_MIDI, 6)).id();
        ok(reserver(monde.nouveauClient(), DEMAIN_MIDI, 6));
        String troisiemeClient = monde.nouveauClient();
        assertThat(reserver(troisiemeClient, DEMAIN_MIDI, 2).statut()).isEqualTo(409);

        assertThat(api.delete(monde.jetonClient, "/api/reservations/" + premiere).statut()).isEqualTo(204);

        assertThat(reserver(troisiemeClient, DEMAIN_MIDI, 2).statut()).isEqualTo(201);
        assertThat(api.get(monde.jetonClient, "/api/reservations").liste("$[?(@.id == " + premiere + ")].statut"))
                .containsExactly("ANNULEE");
    }

    @Test
    void unClientNePeutAnnulerQueSesReservationsEtUneSeuleFois() {
        long reservation = ok(reserver(monde.jetonClient, DEMAIN_MIDI, 2)).id();

        assertThat(api.delete(monde.nouveauClient(), "/api/reservations/" + reservation).statut()).isEqualTo(403);
        assertThat(api.delete(monde.jetonClient, "/api/reservations/" + reservation).statut()).isEqualTo(204);
        assertThat(api.delete(monde.jetonClient, "/api/reservations/" + reservation).statut()).isEqualTo(409);
    }

    @Test
    void regle9UnChangementDHorairesNAnnulePasUneReservationConfirmee() {
        long reservation = ok(reserver(monde.jetonClient, DEMAIN_MIDI, 2)).id();
        Map<String, Object> restaurant = Monde.requeteRestaurant("Horaires reduits");
        restaurant.put("horaires", List.of(Map.of("jour", "LUNDI", "heureOuverture", "08:00:00", "heureFermeture", "09:00:00")));
        restaurant.put("tables", tablesExistantes());
        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId, restaurant));

        assertThat(api.get(monde.jetonClient, "/api/reservations").liste("$[?(@.id == " + reservation + ")].statut"))
                .containsExactly("CONFIRMEE");
    }

    @Test
    void regle13UnRestaurantDesactiveRefuseLesReservationsSansAnnulerLesConfirmees() {
        long reservation = ok(reserver(monde.jetonClient, DEMAIN_MIDI, 2)).id();

        ok(api.put(monde.jetonAdmin, "/api/admin/restaurants/" + monde.restaurantId + "/desactiver", null));

        assertThat(reserver(monde.jetonClient, DEMAIN_MIDI.plusDays(1), 2).statut()).isEqualTo(404);
        assertThat(api.get(monde.jetonClient, "/api/reservations").liste("$[?(@.id == " + reservation + ")].statut"))
                .containsExactly("CONFIRMEE");
    }

    @Test
    void regle8LaBaseRefuseElleMemeDeuxReservationsConfirmeesQuiSeChevauchentSurUneTable() {
        ok(reserver(monde.jetonClient, DEMAIN_MIDI, 6));
        long autre = ok(reserver(monde.jetonClient, DEMAIN_MIDI.plusDays(3), 2)).id();
        long table3 = monde.tables.get(3);
        String insertion = "insert into reservation_table (reservation_id, table_id, heure_debut, heure_fin, statut) "
                + "values (?, ?, ?, ?, ?)";

        assertThatThrownBy(() -> jdbc.update(insertion, autre, table3,
                DEMAIN_MIDI.plusMinutes(60), DEMAIN_MIDI.plusMinutes(150), "CONFIRMEE"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .satisfies(e -> assertThat(((SQLException) NestedExceptionUtils.getMostSpecificCause(e)).getSQLState())
                        .as("violation de la contrainte d'exclusion").isEqualTo("23P01"));

        // Une ligne annulee ne bloque rien.
        assertThat(jdbc.update(insertion, autre, table3,
                DEMAIN_MIDI.plusMinutes(60), DEMAIN_MIDI.plusMinutes(150), "ANNULEE")).isEqualTo(1);
    }

    @Test
    void desReservationsSimultaneesNeReserventJamaisDeuxFoisLaMemeTable() throws Exception {
        int clients = 8;
        List<String> jetons = new ArrayList<>();
        for (int i = 0; i < clients; i++) {
            jetons.add(monde.nouveauClient());
        }
        CountDownLatch depart = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(clients);
        List<Future<Integer>> resultats = new ArrayList<>();
        for (String jeton : jetons) {
            resultats.add(pool.submit(() -> {
                depart.await();
                return reserver(jeton, DEMAIN_MIDI, 6).statut();
            }));
        }
        depart.countDown();
        List<Integer> statuts = new ArrayList<>();
        for (Future<Integer> resultat : resultats) {
            statuts.add(resultat.get());
        }
        pool.shutdown();

        // Cadre « critical » : les reservations passent l'une apres l'autre et la seconde
        // obtient d'autres tables. 12 places : la table de 6, puis les tables de 2 + 4.
        assertThat(statuts).allMatch(s -> s == 201 || s == 409);
        assertThat(statuts.stream().filter(s -> s == 201).count()).isEqualTo(2);
        Integer chevauchements = jdbc.queryForObject("""
                select count(*) from reservation_table a join reservation_table b
                  on a.table_id = b.table_id and a.reservation_id < b.reservation_id
                 and a.statut = 'CONFIRMEE' and b.statut = 'CONFIRMEE'
                 and a.heure_debut < b.heure_fin and b.heure_debut < a.heure_fin
                join restaurant_table t on t.id = a.table_id
                where t.restaurant_id = ?
                """, Integer.class, monde.restaurantId);
        assertThat(chevauchements).isZero();
    }

    @Test
    void leGerantVoitLesReservationsAVenirDeSonSeulRestaurantEtQuiJoindre() {
        long confirmee = ok(reserver(monde.jetonClient, DEMAIN_MIDI, 3)).id();
        long annulee = ok(reserver(monde.jetonClient, DEMAIN_MIDI.plusDays(1), 2)).id();
        assertThat(api.delete(monde.jetonClient, "/api/reservations/" + annulee).statut()).isEqualTo(204);

        // La base de test garde les reservations des autres restaurants : il ne voit que la sienne.
        Reponse aVenir = ok(api.get(monde.jetonGerant, "/api/gerant/reservations"));
        assertThat(aVenir.liste("$[*].id")).containsExactly((int) confirmee);
        assertThat(aVenir.<String>lire("$[0].clientEmail"))
                .isEqualTo(api.get(monde.jetonClient, "/api/me").<String>lire("$.email"));
    }

    private List<Map<String, Object>> tablesExistantes() {
        return List.of(
                Map.of("id", monde.tables.get(1), "numero", 1, "capacite", 2),
                Map.of("id", monde.tables.get(2), "numero", 2, "capacite", 4),
                Map.of("id", monde.tables.get(3), "numero", 3, "capacite", 6));
    }
}
