package io.github.samska.sandbox.account.application;

import java.util.Optional;
import java.util.UUID;

import io.github.samska.sandbox.account.Account;

public interface AccountStore {

    /** Stores the account; returns false and stores nothing when the email is already registered. */
    boolean insert(Account account);

    Optional<Account> findByEmail(String email);

    Optional<Account> findById(UUID id);
}
