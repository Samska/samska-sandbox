package io.github.samska.sandbox.account.application;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import io.github.samska.sandbox.account.Account;
import io.github.samska.sandbox.account.Role;

@Service
public class AccountService {

    static final int MIN_PASSWORD_LENGTH = 8;
    /** BCrypt ignores bytes past 72, so longer passwords would silently weaken. */
    static final int MAX_PASSWORD_BYTES = 72;
    static final int MAX_EMAIL_LENGTH = 254;
    static final int MAX_NAME_LENGTH = 60;

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final AccountStore store;
    private final PasswordEncoder encoder;
    private final String unknownAccountHash;

    public AccountService(AccountStore store, PasswordEncoder encoder) {
        this.store = store;
        this.encoder = encoder;
        // Verified when the email is unknown so that response time does not reveal registered emails.
        this.unknownAccountHash = encoder.encode("not-a-real-password");
    }

    /**
     * Creates an account. There is no public sign-up: the only caller in production is the administrator
     * bootstrap, and tests use it to create customer accounts.
     */
    public Account register(String email, String displayName, String password, Role role) {
        var normalizedEmail = normalizeEmail(email);
        var name = displayName == null ? "" : displayName.strip();
        if (name.isEmpty() || name.length() > MAX_NAME_LENGTH) {
            throw new InvalidAccountException("Name must be 1 to " + MAX_NAME_LENGTH + " characters");
        }
        validatePassword(password);

        var account = new Account(UUID.randomUUID(), normalizedEmail, name, encoder.encode(password), role);
        if (!store.insert(account)) {
            throw new EmailAlreadyRegisteredException();
        }
        return account;
    }

    public Account authenticate(String email, String password) {
        Optional<Account> found = email == null ? Optional.empty() : store.findByEmail(email.strip().toLowerCase(Locale.ROOT));
        var candidate = password == null ? "" : password;
        var hash = found.map(Account::passwordHash).orElse(unknownAccountHash);
        var matches = encoder.matches(candidate, hash);
        if (found.isEmpty() || !matches) {
            throw new InvalidCredentialsException();
        }
        return found.get();
    }

    public Optional<Account> find(UUID id) {
        return store.findById(id);
    }

    /** Creates the administrator when it does not exist yet; used at startup from configuration. */
    public boolean ensureAdministrator(String email, String password) {
        var normalizedEmail = normalizeEmail(email);
        if (store.findByEmail(normalizedEmail).isPresent()) {
            return false;
        }
        register(normalizedEmail, "Administrator", password, Role.ADMIN);
        return true;
    }

    private static String normalizeEmail(String email) {
        var value = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        if (value.length() > MAX_EMAIL_LENGTH || !EMAIL.matcher(value).matches()) {
            throw new InvalidAccountException("Email must be a valid address");
        }
        return value;
    }

    private static void validatePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new InvalidAccountException(
                    "Password must be " + MIN_PASSWORD_LENGTH + " characters or more and at most "
                            + MAX_PASSWORD_BYTES + " bytes");
        }
    }
}
