package com.saes.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Restaurant;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
}
