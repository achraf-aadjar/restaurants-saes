package com.saes.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "saes.jwt.secret=cle-de-test-uniquement-au-moins-32-caracteres")
class SaesBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
