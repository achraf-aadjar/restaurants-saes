package com.saes.backend.web.dto;

import java.util.List;

public record StatistiquesVentesDto(
        int nombreCommandesPayees,
        double montantMoyen,
        List<VenteParPlatDto> parPlat,
        List<VenteParCategorieDto> parCategorie) {
}
