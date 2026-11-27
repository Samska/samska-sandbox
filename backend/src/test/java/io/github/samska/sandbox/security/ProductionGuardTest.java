package io.github.samska.sandbox.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionGuardTest {

    private static final String STRONG = "a-long-synthetic-pass";

    @Test
    void acceptsASafeConfigurationWithOrWithoutAnAdministrator() {
        assertThatCode(() -> new ProductionGuard(true, true, STRONG, "db-secret")).doesNotThrowAnyException();
        assertThatCode(() -> new ProductionGuard(true, true, "", "db-secret")).doesNotThrowAnyException();
    }

    @Test
    void refusesToRunWithoutEnforcement() {
        assertThatThrownBy(() -> new ProductionGuard(false, true, STRONG, "db-secret"))
                .hasMessageContaining("enforced");
    }

    @Test
    void refusesInsecureCookies() {
        assertThatThrownBy(() -> new ProductionGuard(true, false, STRONG, "db-secret"))
                .hasMessageContaining("secure-cookies");
    }

    @Test
    void refusesAShortAdministratorPassword() {
        assertThatThrownBy(() -> new ProductionGuard(true, true, "short-pass", "db-secret"))
                .hasMessageContaining("at least 12");
    }

    @Test
    void refusesAMissingDatabasePassword() {
        assertThatThrownBy(() -> new ProductionGuard(true, true, STRONG, " "))
                .hasMessageContaining("datasource.password");
    }
}
