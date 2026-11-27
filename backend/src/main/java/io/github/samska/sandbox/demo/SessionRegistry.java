package io.github.samska.sandbox.demo;

import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;

import org.springframework.stereotype.Component;

/** Knows the open sessions so a data reset can sign everyone out, because their accounts no longer exist. */
@Component
public class SessionRegistry implements HttpSessionListener {

    private final ConcurrentHashMap<String, HttpSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void sessionCreated(HttpSessionEvent event) {
        sessions.put(event.getSession().getId(), event.getSession());
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent event) {
        sessions.remove(event.getSession().getId());
    }

    /** Invalidates every session except the one with the given id (null keeps none). */
    public void invalidateAllExcept(String keepId) {
        for (var session : sessions.values()) {
            if (!session.getId().equals(keepId)) {
                try {
                    session.invalidate();
                } catch (IllegalStateException alreadyInvalid) {
                    sessions.remove(session.getId());
                }
            }
        }
    }
}
