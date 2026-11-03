package com.saes.backend.support;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.UtilisateurRepository;

import tools.jackson.databind.json.JsonMapper;

/**
 * Base des tests d'integration : application complete (securite comprise)
 * sur une vraie PostgreSQL, et un restaurant neuf pour chaque test.
 */
@SpringBootTest(properties = "saes.jwt.secret=" + IntegrationTest.SECRET_JWT)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegrationTest {

    public static final String SECRET_JWT = "cle-de-test-uniquement-au-moins-32-caracteres";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JsonMapper json;

    @Autowired
    protected UtilisateurRepository utilisateurRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected CommandeRepository commandeRepository;

    protected Api api;
    protected Monde monde;

    @BeforeEach
    void preparerMonde() {
        api = new Api(mvc, json);
        monde = Monde.creer(api, utilisateurRepository, passwordEncoder, commandeRepository);
    }
}
