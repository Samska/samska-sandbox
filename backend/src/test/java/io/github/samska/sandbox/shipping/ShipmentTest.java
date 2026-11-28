package io.github.samska.sandbox.shipping;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.shipping.Shipment.StatusChange;

import static org.assertj.core.api.Assertions.assertThat;

class ShipmentTest {

    private static final UUID ID = UUID.fromString("2afa6574-0000-4000-8000-000000000001");
    private static final Instant PLACED = Instant.parse("2026-11-27T10:00:00Z");

    private static Shipment of(StatusChange... changes) {
        return Shipment.of(ID, 128, PLACED, List.of(changes));
    }

    @Test
    void anOrderWithNoChangeIsPlacedAndAllLaterStepsAreStillToCome() {
        var shipment = of();

        assertThat(shipment.status()).isEqualTo(OrderStatus.PLACED);
        assertThat(shipment.orderNumber()).isEqualTo("SK-000128");
        assertThat(shipment.steps()).extracting(ShipmentStep::code)
                .containsExactly("PLACED", "PACKED", "SHIPPED", "DELIVERED");
        assertThat(shipment.steps()).extracting(ShipmentStep::done).containsExactly(true, false, false, false);
        assertThat(shipment.steps().get(0).at()).isEqualTo(PLACED);
        assertThat(shipment.steps().get(1).at()).isNull();
    }

    @Test
    void theStatusIsTheLatestRecordedChangeAndItsTimeIsTheRealOne() {
        var packedAt = Instant.parse("2026-11-28T08:30:00Z");
        var shipment = of(new StatusChange(OrderStatus.PACKED, packedAt));

        assertThat(shipment.status()).isEqualTo(OrderStatus.PACKED);
        assertThat(shipment.steps()).extracting(ShipmentStep::done).containsExactly(true, true, false, false);
        assertThat(shipment.steps().get(1).at()).isEqualTo(packedAt);
    }

    @Test
    void aCancelledOrderShowsItsHistoryAndNoStepsToCome() {
        var shipment = of(
                new StatusChange(OrderStatus.PACKED, PLACED.plusSeconds(60)),
                new StatusChange(OrderStatus.CANCELLED, PLACED.plusSeconds(120)));

        assertThat(shipment.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(shipment.steps()).extracting(ShipmentStep::code).containsExactly("PLACED", "PACKED", "CANCELLED");
        assertThat(shipment.steps()).extracting(ShipmentStep::done).containsOnly(true);
    }

    @Test
    void aCorrectedStatusKeepsEveryRecordedChangeInOrder() {
        var shipment = of(
                new StatusChange(OrderStatus.SHIPPED, PLACED.plusSeconds(60)),
                new StatusChange(OrderStatus.PACKED, PLACED.plusSeconds(120)));

        assertThat(shipment.status()).isEqualTo(OrderStatus.PACKED);
        assertThat(shipment.steps()).extracting(ShipmentStep::code)
                .containsExactly("PLACED", "SHIPPED", "PACKED", "SHIPPED", "DELIVERED");
    }
}
