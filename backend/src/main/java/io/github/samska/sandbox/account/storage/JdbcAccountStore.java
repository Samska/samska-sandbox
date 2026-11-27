package io.github.samska.sandbox.account.storage;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.account.Account;
import io.github.samska.sandbox.account.Role;
import io.github.samska.sandbox.account.application.AccountStore;

public class JdbcAccountStore implements AccountStore {

    private final JdbcClient jdbc;

    public JdbcAccountStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean insert(Account account) {
        // No conflict target: the unique index on lower(email) resolves to "no row inserted".
        return jdbc.sql("""
                        INSERT INTO accounts (account_id, email, display_name, password_hash, role)
                        VALUES (:id, :email, :name, :hash, :role)
                        ON CONFLICT DO NOTHING
                        """)
                .param("id", account.id())
                .param("email", account.email())
                .param("name", account.displayName())
                .param("hash", account.passwordHash())
                .param("role", account.role().name())
                .update() == 1;
    }

    @Override
    public Optional<Account> findByEmail(String email) {
        return jdbc.sql("SELECT account_id, email, display_name, password_hash, role FROM accounts WHERE lower(email) = lower(:email)")
                .param("email", email)
                .query(JdbcAccountStore::map)
                .optional();
    }

    @Override
    public Optional<Account> findById(UUID id) {
        return jdbc.sql("SELECT account_id, email, display_name, password_hash, role FROM accounts WHERE account_id = :id")
                .param("id", id)
                .query(JdbcAccountStore::map)
                .optional();
    }

    private static Account map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new Account(
                rs.getObject("account_id", UUID.class),
                rs.getString("email"),
                rs.getString("display_name"),
                rs.getString("password_hash"),
                Role.valueOf(rs.getString("role")));
    }
}
