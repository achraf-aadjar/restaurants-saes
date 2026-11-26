package com.saes.backend.web;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.service.GerantRapportService;
import com.saes.backend.service.GerantStatistiquesService;
import com.saes.backend.service.GerantStockService;
import com.saes.backend.service.RecommandationService;
import com.saes.backend.web.dto.IngredientDto;
import com.saes.backend.web.dto.RapportFinancierDto;
import com.saes.backend.web.dto.RecommandationDto;
import com.saes.backend.web.dto.StatistiquesVentesDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Supervision d'un restaurant par l'administrateur : statistiques de ventes,
 * rapports financiers, stocks et recommandations d'approvisionnement.
 *
 * <p>ECART ASSUME AU CAHIER DES CHARGES : le §4.5 et le §4.6 reservent ces
 * consultations au gerant. L'administrateur y accede ici, <b>en lecture
 * seule</b> : aucune route d'ecriture n'est exposee, il ne peut ni modifier un
 * stock ni declarer une commande abandonnee. Le calcul est celui du gerant (les
 * memes services), pour que les deux voient exactement les memes chiffres.
 *
 * <p>Securite : /api/admin/** est reserve au role ADMINISTRATEUR (SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin/restaurants/{restaurantId}")
@RequiredArgsConstructor
public class AdminSupervisionController {

    private final RestaurantRepository restaurantRepository;
    private final GerantStatistiquesService statistiquesService;
    private final GerantRapportService rapportService;
    private final GerantStockService stockService;
    private final RecommandationService recommandationService;

    @GetMapping("/statistiques-ventes")
    public StatistiquesVentesDto statistiques(
            @PathVariable Long restaurantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return statistiquesService.consulterPourRestaurant(restaurant(restaurantId), debut, fin);
    }

    @GetMapping("/rapports-financiers")
    public RapportFinancierDto rapports(
            @PathVariable Long restaurantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return rapportService.consulterPourRestaurant(restaurant(restaurantId), debut, fin);
    }

    @GetMapping("/stocks")
    public List<IngredientDto> stocks(@PathVariable Long restaurantId) {
        return stockService.listerPourRestaurant(restaurant(restaurantId));
    }

    @GetMapping("/recommandations")
    public List<RecommandationDto> recommandations(@PathVariable Long restaurantId) {
        return recommandationService.listerPourRestaurant(restaurant(restaurantId));
    }

    private Restaurant restaurant(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
    }
}
