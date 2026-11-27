package io.github.samska.sandbox.account.security;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import io.github.samska.sandbox.account.CurrentAccount;

@Component
class SecurityCurrentAccount implements CurrentAccount {

    private final boolean enforced;

    SecurityCurrentAccount(@Value("${samska.security.enforced:true}") boolean enforced) {
        this.enforced = enforced;
    }

    @Override
    public UUID id() {
        if (!enforced) {
            return LOCAL;
        }
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal principal) {
            return principal.id();
        }
        // The filter chain rejects anonymous requests before any owned state is touched.
        throw new IllegalStateException("No authenticated account for an account-scoped operation");
    }
}
