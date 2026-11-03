package com.saes.backend.web.dto;

import java.time.LocalDate;

public record EncaissementJourDto(LocalDate jour, int montantEspeces, int montantMobileMoney) {
}
