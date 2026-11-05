package com.saes.backend.web;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.service.AdminSupervisionService;
import com.saes.backend.web.dto.SupervisionDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Espace d'administration : vue sur tous les restaurants, en lecture seule
 * (/api/admin/** : role ADMINISTRATEUR). Periode par defaut : les 30 derniers jours.
 */
@RestController
@RequestMapping("/api/admin/supervision")
@RequiredArgsConstructor
public class AdminSupervisionController {

    private static final int JOURS_MAXIMUM = 366;

    private final AdminSupervisionService supervisionService;

    @GetMapping("/tableau-de-bord")
    public SupervisionDto.TableauDeBord tableauDeBord(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Periode p = periode(debut, fin);
        return supervisionService.tableauDeBord(p.debut(), p.fin());
    }

    @GetMapping("/commandes")
    public List<SupervisionDto.Commande> commandes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Periode p = periode(debut, fin);
        return supervisionService.commandes(p.debut(), p.fin());
    }

    @GetMapping("/reservations")
    public List<SupervisionDto.Reservation> reservations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDate d = debut != null ? debut : LocalDate.now();
        Periode p = periode(d, fin != null ? fin : d.plusDays(30));
        return supervisionService.reservations(p.debut(), p.fin());
    }

    @GetMapping("/caisses")
    public List<SupervisionDto.Caisse> caisses() {
        return supervisionService.caisses();
    }

    @GetMapping("/stocks")
    public List<SupervisionDto.Stock> stocks() {
        return supervisionService.stocks();
    }

    private record Periode(LocalDate debut, LocalDate fin) {
    }

    private static Periode periode(LocalDate debut, LocalDate fin) {
        LocalDate f = fin != null ? fin : LocalDate.now();
        LocalDate d = debut != null ? debut : f.minusDays(29);
        if (f.isBefore(d)) {
            throw ApiException.badRequest("La date de fin ne peut pas etre avant la date de debut");
        }
        if (d.plusDays(JOURS_MAXIMUM).isBefore(f)) {
            throw ApiException.badRequest("La periode ne peut pas depasser un an");
        }
        return new Periode(d, f);
    }
}
