package com.saes.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.SessionCaisse;

public interface SessionCaisseRepository extends JpaRepository<SessionCaisse, Long> {

    List<SessionCaisse> findTop100ByOrderByDateHeureOuvertureDesc();

    long countByDateHeureClotureIsNull();

    Optional<SessionCaisse> findByCaissierIdAndDateHeureClotureIsNull(Long caissierId);

    List<SessionCaisse> findByCaissier_Restaurant_IdAndDateHeureOuvertureBetween(
            Long restaurantId, java.time.Instant debut, java.time.Instant fin);

    List<SessionCaisse> findByCaissier_Restaurant_IdAndDateHeureClotureBetween(
            Long restaurantId, java.time.Instant debut, java.time.Instant fin);
}
