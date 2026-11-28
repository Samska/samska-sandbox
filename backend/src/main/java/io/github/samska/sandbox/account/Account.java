package io.github.samska.sandbox.account;

import java.util.UUID;

public record Account(UUID id, String email, String displayName, String passwordHash, Role role) {

    @Override
    public String toString() {
        return "Account[id=" + id + ", role=" + role + "]";
    }
}
