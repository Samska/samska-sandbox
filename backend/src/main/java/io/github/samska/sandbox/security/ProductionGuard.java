package io.github.samska.sandbox.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** In the {@code prod} profile the application refuses to start with settings that weaken security. */
@Component
@Profile("prod")
public class ProductionGuard {

    static final int MIN_ADMIN_PASSWORD_LENGTH = 12;

    public ProductionGuard(
            @Value("${samska.security.enforced:true}") boolean enforced,
            @Value("${samska.security.secure-cookies:false}") boolean secureCookies,
            @Value("${samska.admin.password:}") String adminPassword,
            @Value("${spring.datasource.password:}") String databasePassword) {
        if (!enforced) {
            throw new IllegalStateException("samska.security.enforced must not be false in production");
        }
        if (!secureCookies) {
            throw new IllegalStateException("samska.security.secure-cookies must be true in production");
        }
        if (!adminPassword.isBlank() && adminPassword.length() < MIN_ADMIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "samska.admin.password must have at least " + MIN_ADMIN_PASSWORD_LENGTH + " characters");
        }
        if (databasePassword.isBlank()) {
            throw new IllegalStateException("spring.datasource.password must be set in production");
        }
    }
}
