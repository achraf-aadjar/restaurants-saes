package com.saes.backend.web.dto;

import java.util.List;

public record RapportFinancierDto(
        List<EncaissementJourDto> encaissementsParJour,
        List<EcartCaisseDto> ecartsCaisse,
        int montantCommandesAbandonnees) {
}
