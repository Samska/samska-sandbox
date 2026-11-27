package io.github.samska.sandbox.catalog.api;

public record CatalogErrorResponse(String code) {

    public static final String STORE_UNAVAILABLE = "catalog-store-unavailable";

    public static CatalogErrorResponse storeUnavailable() {
        return new CatalogErrorResponse(STORE_UNAVAILABLE);
    }
}
