package com.saes.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.ModePaiement;
import com.saes.backend.domain.Paiement;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.SessionCaisse;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.repository.PaiementRepository;
import com.saes.backend.repository.ReservationRepository;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.SessionCaisseRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.EncaissementJourDto;
import com.saes.backend.web.dto.SupervisionDto;
import com.saes.backend.web.dto.SupervisionDto.Caisse;
import com.saes.backend.web.dto.SupervisionDto.Finances;
import com.saes.backend.web.dto.SupervisionDto.Indicateurs;
import com.saes.backend.web.dto.SupervisionDto.ParRestaurant;
import com.saes.backend.web.dto.SupervisionDto.Stock;
import com.saes.backend.web.dto.SupervisionDto.TableauDeBord;
import com.saes.backend.web.dto.SupervisionDto.VenteParPlat;

import lombok.RequiredArgsConstructor;

/**
 * Espace d'administration : supervision de tous les restaurants, en lecture
 * seule (extension au cahier des charges, ou l'administrateur gere seulement
 * les restaurants et les comptes, §4.7). Les montants suivent les memes
 * regles que les rapports du gerant (§4.5, §4.6) : montant d'une commande =
 * somme prix x quantite ; chiffre d'affaires = commandes payees.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSupervisionService {

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final List<StatutCommande> EN_COURS =
            List.of(StatutCommande.EN_ATTENTE, StatutCommande.EN_PREPARATION, StatutCommande.PRETE);

    private final RestaurantRepository restaurantRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CommandeRepository commandeRepository;
    private final PaiementRepository paiementRepository;
    private final SessionCaisseRepository sessionCaisseRepository;
    private final ReservationRepository reservationRepository;
    private final IngredientRepository ingredientRepository;
    private final MouvementStockRepository mouvementStockRepository;
    private final JournalService journalService;

    public TableauDeBord tableauDeBord(LocalDate debut, LocalDate fin) {
        Instant debutInstant = debut.atStartOfDay(ZONE).toInstant();
        Instant finInstant = fin.plusDays(1).atStartOfDay(ZONE).toInstant();
        List<Paiement> paiements = paiementRepository.findByDateHeureBetween(debutInstant, finInstant);
        List<Commande> commandesPeriode = commandeRepository.findByDateHeureBetweenOrderByDateHeureDesc(debutInstant, finInstant);
        return new TableauDeBord(
                indicateurs(),
                finances(debut, fin, paiements, commandesPeriode),
                meilleursPlats(paiements),
                journalService.plusRecentes(8));
    }

    private Indicateurs indicateurs() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        List<Utilisateur> comptes = utilisateurRepository.findAll();
        Map<Role, Long> parRole = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            parRole.put(role, comptes.stream().filter(u -> u.getRoles().contains(role)).count());
        }
        Map<StatutCommande, Long> enCours = new EnumMap<>(StatutCommande.class);
        EN_COURS.forEach(s -> enCours.put(s, 0L));
        commandeRepository.findByStatutInOrderByDateHeureAsc(EN_COURS).forEach(c -> enCours.merge(c.getStatut(), 1L, Long::sum));
        LocalDate aujourdHui = LocalDate.now(ZONE);
        long reservationsAujourdhui = reservationRepository
                .findByDateHeureBetweenOrderByDateHeureAsc(aujourdHui.atStartOfDay(), aujourdHui.plusDays(1).atStartOfDay())
                .stream().filter(r -> r.getStatut() == StatutReservation.CONFIRMEE).count();
        long enAlerte = ingredientRepository.findAll().stream()
                .filter(i -> mouvementStockRepository.calculerStock(i.getId()).compareTo(i.getSeuilAlerte()) <= 0)
                .count();
        return new Indicateurs(
                restaurants.stream().filter(Restaurant::isEstActif).count(),
                restaurants.stream().filter(r -> !r.isEstActif()).count(),
                comptes.stream().filter(Utilisateur::isEstActif).count(),
                comptes.stream().filter(u -> !u.isEstActif()).count(),
                parRole,
                enCours,
                sessionCaisseRepository.countByDateHeureClotureIsNull(),
                reservationsAujourdhui,
                enAlerte);
    }

    private Finances finances(LocalDate debut, LocalDate fin, List<Paiement> paiements, List<Commande> commandesPeriode) {
        Map<LocalDate, int[]> parJour = new LinkedHashMap<>();
        SupervisionDto.jours(debut, fin).forEach(j -> parJour.put(j, new int[2]));
        Map<Long, ParRestaurantCumul> parRestaurant = new LinkedHashMap<>();
        restaurantRepository.findAll().forEach(r -> parRestaurant.put(r.getId(), new ParRestaurantCumul(r.getNom())));
        int especes = 0;
        int mobile = 0;
        for (Paiement p : paiements) {
            int montant = montant(p.getCommande());
            int[] jour = parJour.computeIfAbsent(p.getDateHeure().atZone(ZONE).toLocalDate(), j -> new int[2]);
            if (p.getModePaiement() == ModePaiement.ESPECES) {
                especes += montant;
                jour[0] += montant;
            } else {
                mobile += montant;
                jour[1] += montant;
            }
            ParRestaurantCumul cumul = parRestaurant.get(p.getCommande().getRestaurant().getId());
            cumul.montant += montant;
            cumul.commandes++;
        }
        int total = especes + mobile;
        int abandonne = commandesPeriode.stream()
                .filter(c -> c.getStatut() == StatutCommande.ABANDONNEE)
                .mapToInt(this::montant).sum();
        return new Finances(
                total, especes, mobile, paiements.size(),
                paiements.isEmpty() ? 0 : (double) total / paiements.size(),
                abandonne,
                parJour.entrySet().stream()
                        .map(e -> new EncaissementJourDto(e.getKey(), e.getValue()[0], e.getValue()[1]))
                        .toList(),
                parRestaurant.entrySet().stream()
                        .map(e -> new ParRestaurant(e.getKey(), e.getValue().nom, e.getValue().montant, e.getValue().commandes))
                        .sorted(Comparator.comparingInt(ParRestaurant::chiffreAffaires).reversed())
                        .toList());
    }

    private List<VenteParPlat> meilleursPlats(List<Paiement> paiements) {
        Map<Long, VenteParPlat> parPlat = new HashMap<>();
        for (Paiement p : paiements) {
            p.getCommande().getLignes().forEach(l -> parPlat.merge(
                    l.getPlat().getId(),
                    new VenteParPlat(l.getPlat().getNom(), p.getCommande().getRestaurant().getNom(),
                            l.getPlat().getCategorie(), l.getQuantite(), l.getQuantite() * l.getPrixUnitaire()),
                    (a, b) -> new VenteParPlat(a.plat(), a.restaurant(), a.categorie(),
                            a.quantite() + b.quantite(), a.montant() + b.montant())));
        }
        return parPlat.values().stream()
                .sorted(Comparator.comparingInt(VenteParPlat::montant).reversed())
                .limit(5)
                .toList();
    }

    public List<SupervisionDto.Commande> commandes(LocalDate debut, LocalDate fin) {
        Map<Long, ModePaiement> modes = paiementRepository
                .findByDateHeureBetween(debut.atStartOfDay(ZONE).toInstant(), Instant.now().plusSeconds(60))
                .stream().collect(Collectors.toMap(p -> p.getCommande().getId(), Paiement::getModePaiement, (a, b) -> a));
        return commandeRepository.findByDateHeureBetweenOrderByDateHeureDesc(
                        debut.atStartOfDay(ZONE).toInstant(), fin.plusDays(1).atStartOfDay(ZONE).toInstant())
                .stream()
                .map(c -> new SupervisionDto.Commande(
                        c.getId(),
                        c.getRestaurant().getNom(),
                        c.getDateHeure(),
                        c.getType(),
                        c.getTable() != null ? c.getTable().getNumero() : null,
                        c.getClient() != null ? "Client : " + nom(c.getClient())
                                : c.getServeur() != null ? "Serveur : " + nom(c.getServeur()) : null,
                        c.getStatut(),
                        montant(c),
                        c.getLignes().stream().map(l -> l.getQuantite() + " x " + l.getPlat().getNom())
                                .collect(Collectors.joining(", ")),
                        modes.get(c.getId())))
                .toList();
    }

    public List<SupervisionDto.Reservation> reservations(LocalDate debut, LocalDate fin) {
        return reservationRepository.findByDateHeureBetweenOrderByDateHeureAsc(debut.atStartOfDay(), fin.plusDays(1).atStartOfDay())
                .stream()
                .map(r -> new SupervisionDto.Reservation(
                        r.getId(),
                        r.getRestaurant().getNom(),
                        nom(r.getClient()),
                        r.getDateHeure(),
                        r.getDureeMinutes(),
                        r.getNombreCouverts(),
                        r.getStatut(),
                        r.getTables().stream().map(rt -> rt.getTable().getNumero()).sorted().toList()))
                .toList();
    }

    public List<Caisse> caisses() {
        return sessionCaisseRepository.findTop100ByOrderByDateHeureOuvertureDesc().stream()
                .map(this::caisse)
                .toList();
    }

    private Caisse caisse(SessionCaisse s) {
        int especes = 0;
        int mobile = 0;
        for (Paiement p : paiementRepository.findBySessionCaisse_Id(s.getId())) {
            if (p.getModePaiement() == ModePaiement.ESPECES) {
                especes += montant(p.getCommande());
            } else {
                mobile += montant(p.getCommande());
            }
        }
        int theorique = s.getFondDeCaisse() + especes;
        Utilisateur caissier = s.getCaissier();
        return new Caisse(
                s.getId(),
                caissier.getRestaurant() != null ? caissier.getRestaurant().getNom() : null,
                nom(caissier),
                s.getDateHeureOuverture(),
                s.getDateHeureCloture(),
                s.getFondDeCaisse(),
                especes,
                mobile,
                theorique,
                s.getMontantCompte(),
                s.getMontantCompte() != null ? s.getMontantCompte() - theorique : null);
    }

    public List<Stock> stocks() {
        return ingredientRepository.findAll().stream()
                .map(this::stock)
                .sorted(Comparator.comparing(Stock::alerte).reversed().thenComparing(Stock::restaurant).thenComparing(Stock::ingredient))
                .toList();
    }

    private Stock stock(Ingredient i) {
        BigDecimal stock = mouvementStockRepository.calculerStock(i.getId());
        BigDecimal aReapprovisionner = i.getNiveauCible().subtract(stock.max(BigDecimal.ZERO)).max(BigDecimal.ZERO);
        return new Stock(i.getId(), i.getRestaurant().getNom(), i.getNom(), i.getUnite(), stock,
                i.getSeuilAlerte(), i.getNiveauCible(), stock.compareTo(i.getSeuilAlerte()) <= 0, aReapprovisionner);
    }

    private int montant(Commande commande) {
        return commande.getLignes().stream().mapToInt(l -> l.getPrixUnitaire() * l.getQuantite()).sum();
    }

    private static String nom(Utilisateur u) {
        return u.getPrenom() + " " + u.getNom();
    }

    private static final class ParRestaurantCumul {
        private final String nom;
        private int montant;
        private long commandes;

        private ParRestaurantCumul(String nom) {
            this.nom = nom;
        }
    }
}
