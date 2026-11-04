package com.saes.backend.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.JournalOperation;
import com.saes.backend.repository.JournalOperationRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.security.UserPrincipal;
import com.saes.backend.web.dto.JournalOperationDto;

import lombok.RequiredArgsConstructor;

/**
 * Historique des operations sensibles. L'entree est ecrite dans la transaction
 * de l'operation (MANDATORY) : si l'operation echoue, elle n'est pas
 * journalisee, et une operation reussie l'est toujours. L'acteur est
 * l'utilisateur connecte.
 */
@Service
@RequiredArgsConstructor
public class JournalService {

    private static final int TAILLE_MAXIMALE = 500;

    private final JournalOperationRepository journalOperationRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void enregistrer(ActionJournal action, String objetType, Long objetId, String details) {
        JournalOperation entree = new JournalOperation();
        entree.setAction(action);
        entree.setObjetType(objetType);
        entree.setObjetId(objetId);
        entree.setDetails(details != null && details.length() > TAILLE_MAXIMALE
                ? details.substring(0, TAILLE_MAXIMALE) : details);
        Authentication connexion = SecurityContextHolder.getContext().getAuthentication();
        if (connexion != null && connexion.getPrincipal() instanceof UserPrincipal principal) {
            entree.setActeur(utilisateurRepository.getReferenceById(principal.getId()));
        }
        journalOperationRepository.save(entree);
    }

    @Transactional(readOnly = true)
    public List<JournalOperationDto> plusRecentes(int nombre) {
        return journalOperationRepository.plusRecentes(PageRequest.of(0, Math.clamp(nombre, 1, 500))).stream()
                .map(JournalOperationDto::from)
                .toList();
    }
}
