package io.github.samska.sandbox.account.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import io.github.samska.sandbox.account.application.AccountService;

/**
 * Creates the administrator from configuration. There is no built-in administrator: without both
 * properties no administrator exists, and the password is never logged.
 */
@Component
class AdministratorBootstrap implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AdministratorBootstrap.class);

    private final AccountService accounts;
    private final String email;
    private final String password;

    AdministratorBootstrap(
            AccountService accounts,
            @Value("${samska.admin.email:}") String email,
            @Value("${samska.admin.password:}") String password) {
        this.accounts = accounts;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            LOG.info("No administrator configured (samska.admin.email and samska.admin.password)");
            return;
        }
        if (accounts.ensureAdministrator(email, password)) {
            LOG.info("Administrator account created");
        }
    }
}
