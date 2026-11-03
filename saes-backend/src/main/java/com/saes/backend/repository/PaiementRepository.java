package com.saes.backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Paiement;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByCommande_Restaurant_IdAndDateHeureBetween(Long restaurantId, Instant debut, Instant fin);

    List<Paiement> findBySessionCaisse_Id(Long sessionCaisseId);
}
