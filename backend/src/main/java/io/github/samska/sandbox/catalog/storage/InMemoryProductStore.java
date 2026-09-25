package io.github.samska.sandbox.catalog.storage;

import java.util.Optional;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.DuplicateProductIdException;
import io.github.samska.sandbox.catalog.application.MediaChange;
import io.github.samska.sandbox.catalog.application.MediaChangeResult;
import io.github.samska.sandbox.catalog.application.MediaLimits;
import io.github.samska.sandbox.catalog.application.ProductSnapshot;
import io.github.samska.sandbox.catalog.application.ProductStore;
import io.github.samska.sandbox.catalog.application.UploadedMedia;

@Component
public class InMemoryProductStore implements ProductStore {

    private final long maxTotalMediaBytes;
    private final ReentrantLock lock = new ReentrantLock();
    private final Map<ProductId, StoredProduct> products = new LinkedHashMap<>();
    private long totalMediaBytes;

    public InMemoryProductStore(
            @Value("${catalog.media.max-total-bytes:" + MediaLimits.MAX_TOTAL_STORED_BYTES + "}") long maxTotalMediaBytes) {
        this.maxTotalMediaBytes = maxTotalMediaBytes;
    }

    @Override
    public void save(Product product) {
        lock.lock();
        try {
            if (products.putIfAbsent(product.id(), new StoredProduct(product, null)) != null) {
                throw new DuplicateProductIdException();
            }
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<ProductSnapshot> replaceProduct(Product product) {
        lock.lock();
        try {
            var existing = products.get(product.id());
            if (existing == null) {
                return Optional.empty();
            }

            var replacement = new StoredProduct(product, existing.media());
            products.put(product.id(), replacement);
            return Optional.of(replacement.toSnapshot());
        } finally {
            lock.unlock();
        }
    }

    @Override
    public boolean deleteById(ProductId id) {
        lock.lock();
        try {
            var removed = products.remove(id);
            if (removed == null) {
                return false;
            }

            totalMediaBytes -= removed.mediaByteLength();
            return true;
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<ProductSnapshot> findById(ProductId id) {
        lock.lock();
        try {
            var stored = products.get(id);
            return stored == null ? Optional.empty() : Optional.of(stored.toSnapshot());
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Collection<ProductSnapshot> findAll() {
        lock.lock();
        try {
            return products.values().stream().map(StoredProduct::toSnapshot).toList();
        } finally {
            lock.unlock();
        }
    }

    @Override
    public MediaChange replaceMedia(ProductId id, UploadedMedia media) {
        lock.lock();
        try {
            var existing = products.get(id);
            if (existing == null) {
                return MediaChange.productNotFound();
            }

            long newTotalBytes = totalMediaBytes - existing.mediaByteLength() + media.byteLength();
            if (newTotalBytes > maxTotalMediaBytes) {
                return MediaChange.capacityExceeded();
            }

            var replacement = new StoredProduct(existing.product(), media);
            products.put(id, replacement);
            totalMediaBytes = newTotalBytes;
            return MediaChange.updated(replacement.toSnapshot());
        } finally {
            lock.unlock();
        }
    }

    @Override
    public MediaChangeResult removeMedia(ProductId id) {
        lock.lock();
        try {
            var existing = products.get(id);
            if (existing == null) {
                return MediaChangeResult.PRODUCT_NOT_FOUND;
            }
            if (existing.media() == null) {
                return MediaChangeResult.NO_MEDIA;
            }

            products.put(id, new StoredProduct(existing.product(), null));
            totalMediaBytes -= existing.mediaByteLength();
            return MediaChangeResult.REMOVED;
        } finally {
            lock.unlock();
        }
    }

    long trackedMediaBytes() {
        lock.lock();
        try {
            return totalMediaBytes;
        } finally {
            lock.unlock();
        }
    }

    private record StoredProduct(Product product, UploadedMedia media) {

        int mediaByteLength() {
            return media == null ? 0 : media.byteLength();
        }

        ProductSnapshot toSnapshot() {
            return new ProductSnapshot(product, media);
        }
    }
}
