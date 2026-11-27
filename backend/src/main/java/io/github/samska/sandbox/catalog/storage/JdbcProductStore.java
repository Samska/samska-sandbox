package io.github.samska.sandbox.catalog.storage;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.DuplicateProductIdException;
import io.github.samska.sandbox.catalog.application.MediaChange;
import io.github.samska.sandbox.catalog.application.MediaChangeResult;
import io.github.samska.sandbox.catalog.application.ProductSnapshot;
import io.github.samska.sandbox.catalog.application.ProductStore;
import io.github.samska.sandbox.catalog.application.UploadedMedia;

public class JdbcProductStore implements ProductStore {

    /** Serializes media budget decisions across transactions and processes. */
    private static final long MEDIA_BUDGET_LOCK = 0x5341_4D53_4B41_0001L;

    private static final String SNAPSHOT_COLUMNS = """
            p.product_id, p.name, p.description, p.price, p.media_key, m.media_id
            """;

    private final JdbcClient jdbc;
    private final long maxTotalMediaBytes;

    public JdbcProductStore(JdbcClient jdbc, long maxTotalMediaBytes) {
        this.jdbc = jdbc;
        this.maxTotalMediaBytes = maxTotalMediaBytes;
    }

    @Override
    @Transactional
    public void save(Product product) {
        int inserted = jdbc.sql("""
                        INSERT INTO products (product_id, name, description, price, media_key)
                        VALUES (:id, :name, :description, :price, :mediaKey)
                        ON CONFLICT (product_id) DO NOTHING
                        """)
                .param("id", product.id().value())
                .param("name", product.name())
                .param("description", product.description())
                .param("price", product.price())
                .param("mediaKey", product.mediaKey())
                .update();
        if (inserted == 0) {
            throw new DuplicateProductIdException();
        }
    }

    @Override
    @Transactional
    public Optional<ProductSnapshot> replaceProduct(Product product) {
        int updated = jdbc.sql("""
                        UPDATE products
                        SET name = :name, description = :description, price = :price, media_key = :mediaKey
                        WHERE product_id = :id
                        """)
                .param("id", product.id().value())
                .param("name", product.name())
                .param("description", product.description())
                .param("price", product.price())
                .param("mediaKey", product.mediaKey())
                .update();
        return updated == 0 ? Optional.empty() : findById(product.id());
    }

    @Override
    @Transactional
    public boolean deleteById(ProductId id) {
        return jdbc.sql("DELETE FROM products WHERE product_id = :id")
                .param("id", id.value())
                .update() > 0;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProductSnapshot> findById(ProductId id) {
        return jdbc.sql("SELECT " + SNAPSHOT_COLUMNS + """
                        FROM products p LEFT JOIN product_media m ON m.product_id = p.product_id
                        WHERE p.product_id = :id
                        """)
                .param("id", id.value())
                .query((resultSet, rowNumber) -> row(resultSet))
                .optional()
                .map(this::withMediaBytes);
    }

    @Override
    @Transactional(readOnly = true)
    public Collection<ProductSnapshot> findAll() {
        // Listing carries media IDs only; image bytes are loaded for a single Product on demand.
        return jdbc.sql("SELECT " + SNAPSHOT_COLUMNS + """
                        FROM products p LEFT JOIN product_media m ON m.product_id = p.product_id
                        ORDER BY p.position
                        """)
                .query((resultSet, rowNumber) -> row(resultSet))
                .list()
                .stream()
                .map(row -> new ProductSnapshot(row.product(), row.mediaId(), null))
                .toList();
    }

    @Override
    @Transactional
    public MediaChange replaceMedia(ProductId id, UploadedMedia media) {
        lockMediaBudget();
        if (!productExists(id)) {
            return MediaChange.productNotFound();
        }

        long otherBytes = jdbc.sql("SELECT COALESCE(SUM(byte_length), 0) FROM product_media WHERE product_id <> :id")
                .param("id", id.value())
                .query(Long.class)
                .single();
        if (otherBytes + media.byteLength() > maxTotalMediaBytes) {
            return MediaChange.capacityExceeded();
        }

        jdbc.sql("""
                        INSERT INTO product_media (product_id, media_id, jpeg, byte_length)
                        VALUES (:id, :mediaId, :jpeg, :byteLength)
                        ON CONFLICT (product_id) DO UPDATE
                        SET media_id = EXCLUDED.media_id, jpeg = EXCLUDED.jpeg, byte_length = EXCLUDED.byte_length
                        """)
                .param("id", id.value())
                .param("mediaId", media.id())
                .param("jpeg", media.jpegBytes())
                .param("byteLength", media.byteLength())
                .update();

        var row = jdbc.sql("SELECT " + SNAPSHOT_COLUMNS + """
                        FROM products p LEFT JOIN product_media m ON m.product_id = p.product_id
                        WHERE p.product_id = :id
                        """)
                .param("id", id.value())
                .query((resultSet, rowNumber) -> row(resultSet))
                .single();
        return MediaChange.updated(new ProductSnapshot(row.product(), media));
    }

    @Override
    @Transactional
    public MediaChangeResult removeMedia(ProductId id) {
        if (!productExists(id)) {
            return MediaChangeResult.PRODUCT_NOT_FOUND;
        }

        int removed = jdbc.sql("DELETE FROM product_media WHERE product_id = :id")
                .param("id", id.value())
                .update();
        return removed == 0 ? MediaChangeResult.NO_MEDIA : MediaChangeResult.REMOVED;
    }

    private void lockMediaBudget() {
        jdbc.sql("SELECT pg_advisory_xact_lock(:key)")
                .param("key", MEDIA_BUDGET_LOCK)
                .query()
                .listOfRows();
    }

    private boolean productExists(ProductId id) {
        return jdbc.sql("SELECT 1 FROM products WHERE product_id = :id FOR UPDATE")
                .param("id", id.value())
                .query(Integer.class)
                .optional()
                .isPresent();
    }

    private ProductSnapshot withMediaBytes(Row row) {
        if (row.mediaId() == null) {
            return new ProductSnapshot(row.product(), null, null);
        }

        var media = jdbc.sql("SELECT media_id, jpeg FROM product_media WHERE product_id = :id")
                .param("id", row.product().id().value())
                .query((resultSet, rowNumber) -> new UploadedMedia(
                        resultSet.getObject("media_id", UUID.class), resultSet.getBytes("jpeg")))
                .single();
        return new ProductSnapshot(row.product(), media);
    }

    private static Row row(java.sql.ResultSet resultSet) throws java.sql.SQLException {
        var product = new Product(
                new ProductId(resultSet.getObject("product_id", UUID.class)),
                resultSet.getString("name"),
                resultSet.getString("description"),
                resultSet.getBigDecimal("price"),
                resultSet.getString("media_key"));
        return new Row(product, resultSet.getObject("media_id", UUID.class));
    }

    private record Row(Product product, UUID mediaId) {
    }
}
