package io.github.samska.sandbox.account.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.account.Account;
import io.github.samska.sandbox.account.Role;
import io.github.samska.sandbox.account.application.AccountService;
import io.github.samska.sandbox.account.security.AccountPrincipal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AccountService accounts;
    private final SecurityContextRepository contextRepository;

    public AuthController(AccountService accounts, SecurityContextRepository contextRepository) {
        this.accounts = accounts;
        this.contextRepository = contextRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<AccountResponse> register(
            @RequestBody RegisterRequest body, HttpServletRequest request, HttpServletResponse response) {
        var account = accounts.register(body.email(), body.displayName(), body.password(), Role.CUSTOMER);
        signIn(account, request, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(AccountResponse.from(account));
    }

    @PostMapping("/login")
    public AccountResponse login(
            @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        var account = accounts.authenticate(body.email(), body.password());
        signIn(account, request, response);
        return AccountResponse.from(account);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal principal) {
            return ResponseEntity.ok(new AccountResponse(
                    principal.id(), principal.email(), principal.displayName(), principal.role().name()));
        }
        return ResponseEntity.noContent().build();
    }

    private void signIn(Account account, HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId(); // session fixation protection
        }
        var principal = new AccountPrincipal(account.id(), account.email(), account.displayName(), account.role());
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, java.util.List.of(new SimpleGrantedAuthority("ROLE_" + account.role().name())));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
    }
}
