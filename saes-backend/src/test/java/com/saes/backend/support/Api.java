package com.saes.backend.support;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import com.jayway.jsonpath.JsonPath;

import tools.jackson.databind.json.JsonMapper;

/** Appels HTTP vers l'API (MockMvc, filtre de securite compris), avec ou sans jeton. */
public class Api {

    private final MockMvc mvc;
    private final JsonMapper json;

    public Api(MockMvc mvc, JsonMapper json) {
        this.mvc = mvc;
        this.json = json;
    }

    public Reponse get(String jeton, String url) {
        return executer(avecJeton(MockMvcRequestBuilders.get(url), jeton), null);
    }

    public Reponse post(String jeton, String url, Object corps) {
        return executer(avecJeton(MockMvcRequestBuilders.post(url), jeton), corps);
    }

    public Reponse put(String jeton, String url, Object corps) {
        return executer(avecJeton(MockMvcRequestBuilders.put(url), jeton), corps);
    }

    public Reponse delete(String jeton, String url) {
        return executer(avecJeton(MockMvcRequestBuilders.delete(url), jeton), null);
    }

    private Reponse executer(MockHttpServletRequestBuilder requete, Object corps) {
        try {
            if (corps != null) {
                requete.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corps));
            }
            var resultat = mvc.perform(requete).andReturn().getResponse();
            return new Reponse(resultat.getStatus(), resultat.getContentAsString(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static MockHttpServletRequestBuilder avecJeton(MockHttpServletRequestBuilder requete, String jeton) {
        return jeton == null ? requete : requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton);
    }

    /** Reponse HTTP ; le corps JSON se lit par chemin JsonPath (ex. "$.statut"). */
    public record Reponse(int statut, String corps) {

        public <T> T lire(String chemin) {
            return JsonPath.read(corps, chemin);
        }

        public long entier(String chemin) {
            return ((Number) JsonPath.read(corps, chemin)).longValue();
        }

        public double decimal(String chemin) {
            return ((Number) JsonPath.read(corps, chemin)).doubleValue();
        }

        public List<Object> liste(String chemin) {
            return JsonPath.read(corps, chemin);
        }

        public long id() {
            return entier("$.id");
        }

        @Override
        public String toString() {
            return statut + " " + corps;
        }
    }
}
