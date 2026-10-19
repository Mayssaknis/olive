package com.olivepress;

import com.olivepress.domain.Role;
import com.olivepress.domain.User;
import com.olivepress.repository.UserRepository;
import com.olivepress.security.JwtService;
import com.olivepress.security.UserPrincipal;
import com.olivepress.service.AuthService;
import com.olivepress.service.SettingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SettingsPermissionTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired SettingService settingService;

    private String tokenFor(User user) {
        return jwtService.generateToken(new UserPrincipal(user));
    }

    private User admin() {
        return userRepository.findByUsername("admin").orElseThrow();
    }

    private User employee() {
        User u = new User();
        u.setUsername("employe_test");
        u.setEmail("employe_test@olivepress.local");
        u.setFullName("Employe Test");
        u.setPasswordHash(passwordEncoder.encode("employe1234"));
        u.setRole(Role.EMPLOYEE);
        u.setPermissions(AuthService.defaultEmployeePermissions());
        u.setActive(true);
        return userRepository.save(u);
    }

    @Test
    void employe_sans_permission_ne_peut_pas_modifier_le_tarif() throws Exception {
        User emp = employee();
        mvc.perform(put("/api/settings/tarif")
                        .header("Authorization", "Bearer " + tokenFor(emp))
                        .contentType(APPLICATION_JSON)
                        .content("{\"tarifParKg\":0.75}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_peut_modifier_le_tarif_et_la_valeur_est_persistee() throws Exception {
        mvc.perform(put("/api/settings/tarif")
                        .header("Authorization", "Bearer " + tokenFor(admin()))
                        .contentType(APPLICATION_JSON)
                        .content("{\"tarifParKg\":0.75}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tarifParKg").value(0.75));

        assertThat(settingService.getTarifPressage()).isEqualByComparingTo("0.75");

        mvc.perform(get("/api/settings/tarif")
                        .header("Authorization", "Bearer " + tokenFor(admin())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tarifParKg").value(0.75));
    }

    @Test
    void tarif_invalide_est_rejete() throws Exception {
        mvc.perform(put("/api/settings/tarif")
                        .header("Authorization", "Bearer " + tokenFor(admin()))
                        .contentType(APPLICATION_JSON)
                        .content("{\"tarifParKg\":0}"))
                .andExpect(status().isBadRequest());
    }
}
