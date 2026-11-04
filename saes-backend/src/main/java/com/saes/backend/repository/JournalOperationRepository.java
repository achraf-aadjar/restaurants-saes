package com.saes.backend.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.saes.backend.domain.JournalOperation;

public interface JournalOperationRepository extends JpaRepository<JournalOperation, Long> {

    @Query("select j from JournalOperation j left join fetch j.acteur order by j.dateHeure desc, j.id desc")
    List<JournalOperation> plusRecentes(Pageable page);
}
