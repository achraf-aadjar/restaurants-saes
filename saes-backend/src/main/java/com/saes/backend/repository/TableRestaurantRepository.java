package com.saes.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.TableRestaurant;

public interface TableRestaurantRepository extends JpaRepository<TableRestaurant, Long> {

    List<TableRestaurant> findByRestaurantId(Long restaurantId);

    boolean existsByRestaurantIdAndNumero(Long restaurantId, Integer numero);
}
