package com.saes.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Commande;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    boolean existsByTableId(Long tableId);
}
