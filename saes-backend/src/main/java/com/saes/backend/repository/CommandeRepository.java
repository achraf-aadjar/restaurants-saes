package com.saes.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.StatutCommande;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByClientIdOrderByDateHeureDesc(Long clientId);

    List<Commande> findByRestaurantIdAndStatutInOrderByDateHeureAsc(Long restaurantId, List<StatutCommande> statuts);

    /**
     * Numeros des tables occupees du restaurant : une table est occupee si
     * elle a une commande EN_ATTENTE, EN_PREPARATION ou PRETE (glossaire du
     * cahier des charges, attribut derive /estOccupee).
     */
    @Query("""
            select distinct c.table.id from Commande c
            where c.restaurant.id = :restaurantId
              and c.table is not null
              and c.statut in :statutsOccupation
            """)
    List<Long> idsTablesOccupees(
            @Param("restaurantId") Long restaurantId,
            @Param("statutsOccupation") List<StatutCommande> statutsOccupation);
}
