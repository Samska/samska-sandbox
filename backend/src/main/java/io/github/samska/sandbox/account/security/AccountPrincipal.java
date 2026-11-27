package io.github.samska.sandbox.account.security;

import java.util.UUID;

import io.github.samska.sandbox.account.Role;

public record AccountPrincipal(UUID id, String email, String displayName, Role role) {
}
