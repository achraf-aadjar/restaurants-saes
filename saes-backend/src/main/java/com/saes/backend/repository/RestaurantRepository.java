package com.saes.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.Restaurant;

import jakarta.persistence.LockModeType;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    /**
     * Charge le restaurant et le verrouille jusqu'a la fin de la transaction :
     * une autre transaction qui le demande attend que celle-ci se termine.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Restaurant r where r.id = :id")
    Optional<Restaurant> findVerrouille(@Param("id") Long id);
}
