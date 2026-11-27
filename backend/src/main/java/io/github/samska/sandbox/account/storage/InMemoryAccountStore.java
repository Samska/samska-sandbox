package io.github.samska.sandbox.account.storage;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import io.github.samska.sandbox.account.Account;
import io.github.samska.sandbox.account.application.AccountStore;

/** Test double for the {@code no-database} profile. */
public class InMemoryAccountStore implements AccountStore {

    private final Map<String, Account> byEmail = new ConcurrentHashMap<>();

    @Override
    public boolean insert(Account account) {
        return byEmail.putIfAbsent(account.email().toLowerCase(java.util.Locale.ROOT), account) == null;
    }

    @Override
    public Optional<Account> findByEmail(String email) {
        return Optional.ofNullable(byEmail.get(email.toLowerCase(java.util.Locale.ROOT)));
    }

    @Override
    public Optional<Account> findById(UUID id) {
        return byEmail.values().stream().filter(account -> account.id().equals(id)).findFirst();
    }
}
