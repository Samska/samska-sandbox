package io.github.samska.sandbox.account;

import java.util.UUID;

/**
 * The owner of the request being served. Cart and Order read it to scope their state; they do
 * not know how the owner was authenticated.
 */
public interface CurrentAccount {

    /** The nil UUID owns state when authentication is not enforced (local tests only). */
    UUID LOCAL = new UUID(0L, 0L);

    UUID id();
}
