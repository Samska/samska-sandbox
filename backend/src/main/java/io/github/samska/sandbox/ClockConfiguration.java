package io.github.samska.sandbox;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class ClockConfiguration {

    /** One injectable clock, so time-dependent behavior can be tested with a fixed instant. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
