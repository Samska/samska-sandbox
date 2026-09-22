import { useEffect, useRef, useState } from "react";
import { listProducts, type ProductResponse } from "./catalogApi";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartResponse
} from "../cart/cartApi";
import CartDrawer from "../cart/CartDrawer";
import CartTrigger from "../cart/CartTrigger";
import ProductBrowse from "./ProductBrowse";
import ProductDetail from "./ProductDetail";
import ProductSetupTools from "./ProductSetupTools";
import StatusMessage from "../ui/StatusMessage";
import { catalogBrowseErrorMessage, cartErrorMessage } from "./messages";

export default function Catalog() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsPending, setProductsPending] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartPending, setCartPending] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pendingFocusProductId = useRef<string | null>(null);
  const viewDetailsButtons = useRef(new Map<string, HTMLButtonElement>());
  const cartTriggerRef = useRef<HTMLButtonElement>(null);

  async function refreshProducts() {
    setProductsPending(true);
    setProductsError(null);

    try {
      setProducts(await listProducts());
    } catch (caughtError) {
      setProductsError(catalogBrowseErrorMessage(caughtError));
    } finally {
      setProductsPending(false);
    }
  }

  async function refreshCart() {
    setCartPending(true);
    setCartError(null);

    try {
      setCart(await getCart());
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  useEffect(() => {
    void refreshProducts();
    void refreshCart();
  }, []);

  useEffect(() => {
    if (selectedProduct === null && pendingFocusProductId.current !== null) {
      const productId = pendingFocusProductId.current;
      pendingFocusProductId.current = null;
      viewDetailsButtons.current.get(productId)?.focus();
    }
  }, [selectedProduct]);

  function handleSelectProduct(product: ProductResponse) {
    setSelectedProduct(product);
  }

  function handleBackToProducts() {
    pendingFocusProductId.current = selectedProduct?.id ?? null;
    setSelectedProduct(null);
  }

  function registerViewDetailsButton(productId: string, node: HTMLButtonElement | null) {
    if (node === null) {
      viewDetailsButtons.current.delete(productId);
      return;
    }

    viewDetailsButtons.current.set(productId, node);
  }

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
    cartTriggerRef.current?.focus();
  }

  async function handleAddToCart(product: ProductResponse) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);

    try {
      setCart(await addCartItem(product.id, 1));
      setCartNotice(`${product.name} added to your Cart.`);
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleUpdateQuantity(productId: string, quantity: number) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);

    try {
      setCart(await updateCartItem(productId, quantity));
      setCartNotice("Cart updated.");
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  async function handleRemoveItem(productId: string) {
    setCartPending(true);
    setCartError(null);
    setCartNotice(null);

    try {
      setCart(await removeCartItem(productId));
      setCartNotice("Item removed from your Cart.");
    } catch (caughtError) {
      setCartError(cartErrorMessage(caughtError));
    } finally {
      setCartPending(false);
    }
  }

  const cartItemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const cartTrigger = (
    <CartTrigger
      buttonRef={cartTriggerRef}
      isOpen={isCartOpen}
      itemCount={cartItemCount}
      total={cart === null ? null : cart.total}
      onClick={openCart}
    />
  );

  return (
    <div className="grid gap-6">
      {selectedProduct !== null ? (
        <ProductDetail
          product={selectedProduct}
          isCartPending={cartPending}
          onBack={handleBackToProducts}
          onAdd={handleAddToCart}
          cartTrigger={cartTrigger}
        />
      ) : (
        <ProductBrowse
          products={products}
          isPending={productsPending}
          error={productsError}
          isCartPending={cartPending}
          onRetry={() => void refreshProducts()}
          onAdd={handleAddToCart}
          onSelect={handleSelectProduct}
          onViewDetailsRef={registerViewDetailsButton}
          cartTrigger={cartTrigger}
        />
      )}
      {cartNotice !== null ? <StatusMessage tone="success">{cartNotice}</StatusMessage> : null}
      <ProductSetupTools onProductCreated={() => void refreshProducts()} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        isPending={cartPending}
        error={cartError}
        onRetry={() => void refreshCart()}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
