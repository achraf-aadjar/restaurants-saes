package com.saes.backend.web.error;

import com.saes.backend.web.dto.CommandeDto;

public record ConflitCommandeResponse(String motif, CommandeDto commandeActuelle) {
}
