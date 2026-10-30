package com.saes.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.Menu;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    List<Menu> findByRestaurantId(Long restaurantId);

    /**
     * Menus en vigueur (glossaire du cahier des charges) : date de debut
     * aujourd'hui ou avant, date de fin absente, aujourd'hui ou apres.
     */
    @Query("""
            select m from Menu m
            where m.restaurant.id = :restaurantId
              and m.dateDebut <= :aujourdHui
              and (m.dateFin is null or m.dateFin >= :aujourdHui)
            """)
    List<Menu> findEnVigueur(@Param("restaurantId") Long restaurantId, @Param("aujourdHui") LocalDate aujourdHui);
}
