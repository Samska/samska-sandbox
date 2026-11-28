package io.github.samska.sandbox.support;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;

/**
 * Test-only filter chain used when {@code samska.security.enforced=false} (set by Surefire) so suites of
 * unrelated features run without sign-in. It lives in the test source set so production code never
 * contains a chain that opens every request.
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "samska.security.enforced", havingValue = "false")
class UnenforcedSecurityConfiguration {

    @Bean
    SecurityFilterChain unenforcedSecurityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.ignoringRequestMatchers(AnyRequestMatcher.INSTANCE))
                .authorizeHttpRequests(requests -> requests.anyRequest().permitAll());
        return http.build();
    }
}
