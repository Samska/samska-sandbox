package io.github.samska.sandbox.account.api;

public record RegisterRequest(String email, String displayName, String password) {
}
