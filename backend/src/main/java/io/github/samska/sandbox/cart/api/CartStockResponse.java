package io.github.samska.sandbox.cart.api;

/** The Cart change was refused for lack of stock; {@code available} is what can still be bought. */
public record CartStockResponse(String code, int available) {
}
