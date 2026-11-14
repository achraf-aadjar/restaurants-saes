package com.saes.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;

import jakarta.persistence.LockModeType;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRolesContaining(Role role);

    /**
     * Charge les comptes et les verrouille jusqu'a la fin de la transaction, dans
     * l'ordre des identifiants : deux transactions verrouillent donc dans le meme
     * ordre et ne peuvent pas s'attendre l'une l'autre.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Utilisateur u where u.id in :ids order by u.id")
    List<Utilisateur> findVerrouilles(@Param("ids") Collection<Long> ids);
}
