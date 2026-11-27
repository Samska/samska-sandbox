package io.github.samska.sandbox.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DemoService {

    private static final Logger LOG = LoggerFactory.getLogger(DemoService.class);

    private final boolean enabled;
    private final DemoStore store;
    private final SessionRegistry sessions;

    public DemoService(
            @Value("${samska.demo.enabled:false}") boolean enabled, DemoStore store, SessionRegistry sessions) {
        this.enabled = enabled;
        this.store = store;
        this.sessions = sessions;
    }

    public boolean enabled() {
        return enabled;
    }

    /** Clears synthetic state; the caller's own session survives so the administrator stays signed in. */
    public void reset(String keepSessionId) {
        store.reset();
        sessions.invalidateAllExcept(keepSessionId);
        LOG.info("Demo data reset");
    }

    /** Runs only when {@code samska.demo.reset-cron} is a cron expression; the default "-" disables it. */
    @Scheduled(cron = "${samska.demo.reset-cron:-}")
    void scheduledReset() {
        if (enabled) {
            reset(null);
        }
    }
}
