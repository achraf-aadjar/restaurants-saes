package com.saes.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.UtilisateurRepository;

class AdministrateurInitialTest {

    private final UtilisateurRepository utilisateurs = mock(UtilisateurRepository.class);
    private final PasswordEncoder encodeur = new BCryptPasswordEncoder();
    private AdministrateurInitial initialisation;

    @BeforeEach
    void preparer() {
        initialisation = new AdministrateurInitial(utilisateurs, encodeur);
    }

    private void configurer(String email, String motDePasse) {
        ReflectionTestUtils.setField(initialisation, "email", email);
        ReflectionTestUtils.setField(initialisation, "motDePasse", motDePasse);
    }

    @Test
    void sansVariablesRienNEstCree() {
        configurer("", "");

        initialisation.run(null);

        verify(utilisateurs, never()).save(any());
    }

    @Test
    void rienNEstCreeSiUnAdministrateurExisteDeja() {
        configurer("admin@saes.sn", "un-mot-de-passe-solide");
        when(utilisateurs.existsByRolesContaining(Role.ADMINISTRATEUR)).thenReturn(true);

        initialisation.run(null);

        verify(utilisateurs, never()).save(any());
    }

    @Test
    void unMotDePasseTropCourtEmpecheLeDemarrage() {
        configurer("admin@saes.sn", "court");

        assertThatThrownBy(() -> initialisation.run(null)).isInstanceOf(IllegalStateException.class);
        verify(utilisateurs, never()).save(any());
    }

    @Test
    void lePremierAdministrateurEstCreeAvecUnMotDePasseHache() {
        configurer("admin@saes.sn", "un-mot-de-passe-solide");

        initialisation.run(null);

        ArgumentCaptor<Utilisateur> cree = ArgumentCaptor.forClass(Utilisateur.class);
        verify(utilisateurs).save(cree.capture());
        assertThat(cree.getValue().getEmail()).isEqualTo("admin@saes.sn");
        assertThat(cree.getValue().getRoles()).containsExactly(Role.ADMINISTRATEUR);
        assertThat(cree.getValue().getMotDePasse()).isNotEqualTo("un-mot-de-passe-solide");
        assertThat(encodeur.matches("un-mot-de-passe-solide", cree.getValue().getMotDePasse())).isTrue();
    }
}
