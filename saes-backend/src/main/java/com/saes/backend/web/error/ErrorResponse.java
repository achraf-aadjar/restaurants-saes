package com.saes.backend.web.error;

/**
 * Format uniforme des refus renvoyes par l'API : { "motif": "..." }.
 */
public record ErrorResponse(String motif) {
}
