package com.olivepress;

import com.jayway.jsonpath.JsonPath;
import com.olivepress.domain.Role;
import com.olivepress.domain.User;
import com.olivepress.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthApiTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void login_avec_identifiants_admin_valides_renvoie_un_token() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("admin"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void login_avec_mauvais_mot_de_passe_renvoie_401() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"mauvais-mot-de-passe\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void endpoint_protege_sans_token_renvoie_401() throws Exception {
        mvc.perform(get("/api/clients")).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_renvoie_un_nouvel_access_token_valide() throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String refresh = JsonPath.read(body, "$.refreshToken");

        String refreshed = mvc.perform(post("/api/auth/refresh")
                        .contentType(APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String newToken = JsonPath.read(refreshed, "$.token");

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void refresh_token_ne_donne_pas_acces_aux_endpoints_proteges() throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin1234\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String refresh = JsonPath.read(body, "$.refreshToken");

        mvc.perform(get("/api/clients").header("Authorization", "Bearer " + refresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changement_de_mot_de_passe_verifie_l_ancien_et_applique_le_nouveau() throws Exception {
        User u = userRepository.findByUsername("pwtest").orElseGet(() -> {
            User created = new User();
            created.setUsername("pwtest");
            created.setEmail("pwtest@olivepress.local");
            created.setPasswordHash(passwordEncoder.encode("oldpass123"));
            created.setFullName("Pw Test");
            created.setRole(Role.EMPLOYEE);
            created.setActive(true);
            created.setPermissions(new HashSet<>());
            return userRepository.save(created);
        });

        String token = token("pwtest", "oldpass123");

        mvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"currentPassword\":\"mauvais\",\"newPassword\":\"nouveau123\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"currentPassword\":\"oldpass123\",\"newPassword\":\"nouveau123\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"pwtest\",\"password\":\"nouveau123\"}"))
                .andExpect(status().isOk());

        String token2 = token("pwtest", "nouveau123");
        mvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(APPLICATION_JSON)
                        .content("{\"currentPassword\":\"nouveau123\",\"newPassword\":\"oldpass123\"}"))
                .andExpect(status().isOk());
    }

    private String token(String username, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }
}
