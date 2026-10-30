package com.saes.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Paiement;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {
}
