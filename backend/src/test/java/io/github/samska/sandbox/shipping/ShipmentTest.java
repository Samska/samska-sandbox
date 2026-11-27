package io.github.samska.sandbox.shipping;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShipmentTest {

    private static final Instant CREATED = Instant.parse("2026-11-27T10:00:00Z");
    private static final ShippingPolicy POLICY = new ShippingPolicy(
            Duration.ofHours(1), Duration.ofHours(4), Duration.ofHours(24), Duration.ofHours(30), Duration.ofDays(1));

    /** An Order ID whose least-significant bits make it on time (remainder 1 modulo 5). */
    private static final UUID ON_TIME = new UUID(0x2AFA6574_0000_4000L, 1L);
    /** An Order ID chosen to be delayed (remainder 0 modulo 5). */
    private static final UUID LATE = new UUID(0x91C20D1E_0000_4000L, 10L);

    private static Shipment at(UUID id, String offset) {
        return Shipment.of(id, CREATED, CREATED.plus(Duration.parse(offset)), POLICY);
    }

    @Test
    void choosesDelayedOrdersFromTheOrderIdOnly() {
        assertThat(Shipment.isDelayed(ON_TIME)).isFalse();
        assertThat(Shipment.isDelayed(LATE)).isTrue();
        assertThat(Shipment.isDelayed(LATE)).isEqualTo(Shipment.isDelayed(LATE));
    }

    @Test
    void movesAnOnTimeShipmentThroughEveryStatus() {
        assertThat(at(ON_TIME, "PT0S").status()).isEqualTo(ShipmentStatus.PROCESSING);
        assertThat(at(ON_TIME, "PT59M").status()).isEqualTo(ShipmentStatus.PROCESSING);
        assertThat(at(ON_TIME, "PT1H").status()).isEqualTo(ShipmentStatus.PACKED);
        assertThat(at(ON_TIME, "PT4H").status()).isEqualTo(ShipmentStatus.IN_TRANSIT);
        assertThat(at(ON_TIME, "PT29H59M").status()).isEqualTo(ShipmentStatus.IN_TRANSIT);
        assertThat(at(ON_TIME, "PT30H").status()).isEqualTo(ShipmentStatus.DELIVERED);
        assertThat(at(ON_TIME, "P30D").status()).isEqualTo(ShipmentStatus.DELIVERED);
    }

    @Test
    void reportsADelayAfterTheWarehouseAndDeliversADayLate() {
        assertThat(at(LATE, "PT3H").status()).isEqualTo(ShipmentStatus.PACKED);
        assertThat(at(LATE, "PT4H").status()).isEqualTo(ShipmentStatus.DELAYED);
        assertThat(at(LATE, "PT53H59M").status()).isEqualTo(ShipmentStatus.DELAYED);
        assertThat(at(LATE, "PT54H").status()).isEqualTo(ShipmentStatus.DELIVERED);
        assertThat(at(LATE, "PT4H").estimatedDelivery()).isEqualTo(CREATED.plus(Duration.ofHours(54)));
        assertThat(at(LATE, "PT4H").delayed()).isTrue();
    }

    @Test
    void marksStepsDoneAsTimePasses() {
        var shipment = at(ON_TIME, "PT5H");

        assertThat(shipment.steps()).extracting(ShipmentStep::code).containsExactly(
                "ORDER_CREATED", "PACKED", "LEFT_WAREHOUSE", "OUT_FOR_DELIVERY", "DELIVERED");
        assertThat(shipment.steps()).extracting(ShipmentStep::done).containsExactly(true, true, true, false, false);
        assertThat(shipment.steps().getFirst().at()).isEqualTo(CREATED);
    }

    @Test
    void derivesStableHumanReadableCodes() {
        var id = UUID.fromString("2afa6574-1b2c-4d3e-8f90-a1b2c3d4e5f6");

        assertThat(Shipment.reference(id)).isEqualTo("2AFA-6574");
        assertThat(Shipment.trackingCode(id)).isEqualTo("SK-1B2C-4D");
        assertThat(at(id, "PT0S").courier()).isEqualTo("Simulated Express");
    }

    @Test
    void rejectsStepsOutOfOrder() {
        assertThatThrownBy(() -> new ShippingPolicy(
                Duration.ofHours(2), Duration.ofHours(1), Duration.ofHours(3), Duration.ofHours(4), Duration.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
