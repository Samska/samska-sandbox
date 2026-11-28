package io.github.samska.sandbox.security;

import java.io.IOException;
import java.time.Clock;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Limits requests per client address: sign-in is strict, the rest of the API is generous.
 * The address is the one the servlet container reports; behind a trusted proxy the {@code prod} profile makes
 * that the forwarded client address. There is deliberately no per-account lockout, so nobody can lock a
 * victim out. The limiter is per process and in memory.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final boolean enabled;
    private final RateLimiter general;
    private final RateLimiter auth;

    public RateLimitFilter(
            Clock clock,
            @Value("${samska.ratelimit.enabled:true}") boolean enabled,
            @Value("${samska.ratelimit.requests-per-minute:600}") int requestsPerMinute,
            @Value("${samska.ratelimit.auth-per-minute:10}") int authPerMinute) {
        this.enabled = enabled;
        this.general = new RateLimiter(requestsPerMinute, clock);
        this.auth = new RateLimiter(authPerMinute, clock);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var client = request.getRemoteAddr();
        var decision = isCredentialRequest(request) ? auth.hit(client) : general.hit(client);
        if (!decision.allowed()) {
            response.setStatus(429);
            response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":\"rate-limited\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private static boolean isCredentialRequest(HttpServletRequest request) {
        var path = request.getRequestURI();
        return "POST".equals(request.getMethod()) && path.equals("/api/auth/login");
    }
}
