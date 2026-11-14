package com.saes.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.JournalOperation;

public interface JournalOperationRepository extends JpaRepository<JournalOperation, Long> {

    @Query("select j from JournalOperation j left join fetch j.acteur where j.action in :actions"
            + " order by j.dateHeure desc, j.id desc")
    List<JournalOperation> plusRecentes(Collection<ActionJournal> actions, Pageable page);
}
