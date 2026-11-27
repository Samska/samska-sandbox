package io.github.samska.sandbox.cart.api;

public record CartErrorResponse(String code) {

    public static final String STORE_UNAVAILABLE = "cart-store-unavailable";

    public static CartErrorResponse storeUnavailable() {
        return new CartErrorResponse(STORE_UNAVAILABLE);
    }
}
