package com.saes.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.SessionCaisse;

public interface SessionCaisseRepository extends JpaRepository<SessionCaisse, Long> {
}
