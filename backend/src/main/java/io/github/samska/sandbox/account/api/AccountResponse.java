package io.github.samska.sandbox.account.api;

import java.util.UUID;

import io.github.samska.sandbox.account.Account;

public record AccountResponse(UUID id, String email, String displayName, String role) {

    public static AccountResponse from(Account account) {
        return new AccountResponse(account.id(), account.email(), account.displayName(), account.role().name());
    }
}
