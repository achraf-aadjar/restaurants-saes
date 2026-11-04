package com.saes.backend.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.service.JournalService;
import com.saes.backend.web.dto.JournalOperationDto;

import lombok.RequiredArgsConstructor;

/** Historique des operations sensibles, consultable par l'administrateur (/api/admin/**). */
@RestController
@RequestMapping("/api/admin/journal")
@RequiredArgsConstructor
public class AdminJournalController {

    private final JournalService journalService;

    @GetMapping
    public List<JournalOperationDto> consulter(@RequestParam(defaultValue = "200") int nombre) {
        return journalService.plusRecentes(nombre);
    }
}
