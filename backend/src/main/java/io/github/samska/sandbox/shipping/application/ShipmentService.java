package io.github.samska.sandbox.shipping.application;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.order.application.OrderNotFoundException;
import io.github.samska.sandbox.shipping.OrderStatus;
import io.github.samska.sandbox.shipping.Shipment;
import io.github.samska.sandbox.shipping.application.ShipmentStore.AdminOrder;
import io.github.samska.sandbox.shipping.application.ShipmentStore.HistoryEntry;

@Service
public class ShipmentService {

    private final ShipmentStore store;

    public ShipmentService(ShipmentStore store) {
        this.store = store;
    }

    /** The tracking of one of the signed-in account's Orders; unknown or foreign Orders are not found. */
    public Shipment track(UUID orderId) {
        return store.track(orderId).orElseThrow(OrderNotFoundException::new);
    }

    public List<HistoryEntry> history() {
        return store.history();
    }

    /** Administrator: every Order, or only those in {@code status}. */
    public List<AdminOrder> listAll(OrderStatus status) {
        return store.listAll(status);
    }

    /** Administrator: sets an Order's status. */
    public AdminOrder changeStatus(UUID orderId, OrderStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Status is required");
        }
        return store.changeStatus(orderId, status);
    }
}
