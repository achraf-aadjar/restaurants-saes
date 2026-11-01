package com.saes.backend.web.error;

import com.saes.backend.web.dto.CommandeDto;

/**
 * Regle 3 du cahier des charges : une action qui change une commande est
 * refusee si la commande a change depuis que l'utilisateur l'a affichee ;
 * il voit alors la commande a jour. Porte directement un CommandeDto (et
 * non l'entite) : par le temps que le @RestControllerAdvice s'execute, la
 * transaction est deja terminee et les collections lazy ne sont plus
 * accessibles (LazyInitializationException).
 */
public class ConflitCommandeException extends RuntimeException {

    private final transient CommandeDto commandeActuelle;

    public ConflitCommandeException(CommandeDto commandeActuelle) {
        super("La commande a change depuis que vous l'avez affichee");
        this.commandeActuelle = commandeActuelle;
    }

    public CommandeDto getCommandeActuelle() {
        return commandeActuelle;
    }
}
