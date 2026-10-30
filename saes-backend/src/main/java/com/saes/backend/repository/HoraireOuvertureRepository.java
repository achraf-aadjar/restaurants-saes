package com.saes.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.HoraireOuverture;

public interface HoraireOuvertureRepository extends JpaRepository<HoraireOuverture, Long> {

    List<HoraireOuverture> findByRestaurantId(Long restaurantId);
}
