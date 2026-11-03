package com.saes.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.saes.backend.support.IntegrationTest;
import com.saes.backend.support.TestcontainersConfiguration;

/** L'application demarre et Flyway applique toutes les migrations sur PostgreSQL 16. */
@SpringBootTest(properties = "saes.jwt.secret=" + IntegrationTest.SECRET_JWT)
@Import(TestcontainersConfiguration.class)
class SaesBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
