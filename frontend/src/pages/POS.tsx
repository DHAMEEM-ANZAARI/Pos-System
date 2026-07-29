import { useEffect, useState, useCallback } from "react";
import client from "../api/client";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  size?: string | null;
  color?: string | null;
}

interface CartLine {
  product: Product;
  quantity: number;
}

const TAX_RATE = 0.18;

export default function POS() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "wallet">("cash");
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const { data } = await client.get("/products", { params: { search: q, limit: 12 } });
      setResults(data.items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(query);
  }, [query, search]);

  const addToCart = (product: Product) => {
    setLastOrder(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      const inCartQty = existing?.quantity || 0;
      if (inCartQty >= product.stock) {
        setMessage({ type: "error", text: `Only ${product.stock} in stock for ${product.name}` });
        return prev;
      }
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, quantity: Math.min(l.quantity + delta, l.product.stock) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const taxAmount = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + taxAmount;

  const checkout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setMessage(null);
    try {
      const { data } = await client.post("/orders/checkout", {
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        discount,
        paymentMethod,
        taxRate: TAX_RATE,
      });
      setLastOrder(data);
      setCart([]);
      setDiscount(0);
      setMessage({ type: "success", text: `Order ${data.orderNumber} completed` });
      search(query);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Checkout failed" });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Product search / grid */}
      <div className="lg:col-span-2">
        <div className="mb-4">
          <input
            autoFocus
            type="text"
            placeholder="Scan or search products by name, SKU, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-line bg-white/50 px-4 py-3 rounded-sm font-tape text-sm focus:border-accent outline-none"
          />
        </div>

        {loading && <div className="text-sm text-muted font-tape">Searching...</div>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {results.map((p) => {
            const inCart = cart.find((l) => l.product.id === p.id)?.quantity || 0;
            const outOfStock = p.stock <= inCart;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className={`text-left border border-line rounded-sm p-3 bg-white/40 hover:border-accent hover:shadow-sm transition-all ${
                  outOfStock ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <div className="text-sm font-medium leading-snug">{p.name}</div>
                {(p.size || p.color) && (
                  <div className="text-xs text-muted mt-0.5">
                    {[p.color, p.size].filter(Boolean).join(" · ")}
                  </div>
                )}
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-tape text-sm font-semibold">₹{p.price.toFixed(2)}</span>
                  <span className="text-xs text-muted">{p.stock - inCart} left</span>
                </div>
              </button>
            );
          })}
          {!loading && results.length === 0 && (
            <div className="col-span-full text-sm text-muted py-8 text-center">
              No products matched "{query}"
            </div>
          )}
        </div>
      </div>

      {/* Receipt tape / cart */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 border border-line rounded-sm bg-white/60 shadow-sm">
          <div className="tape-edge-top" />
          <div className="px-5 py-4 font-tape text-sm">
            <div className="text-xs uppercase tracking-widest text-muted mb-3">Current Sale</div>

            {cart.length === 0 ? (
              <div className="text-muted text-xs py-6 text-center">Cart is empty — add items from the catalog</div>
            ) : (
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                {cart.map((l) => (
                  <div key={l.product.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{l.product.name}</div>
                      <div className="text-xs text-muted">₹{l.product.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(l.product.id, -1)}
                        className="w-6 h-6 border border-line rounded-sm hover:border-accent"
                      >
                        −
                      </button>
                      <span className="w-5 text-center">{l.quantity}</span>
                      <button
                        onClick={() => updateQty(l.product.id, 1)}
                        className="w-6 h-6 border border-line rounded-sm hover:border-accent"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-16 text-right">₹{(l.product.price * l.quantity).toFixed(2)}</div>
                    <button
                      onClick={() => removeLine(l.product.id)}
                      className="text-rust text-xs hover:underline"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-dashed border-line pt-3 space-y-1">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>Discount</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-right border border-line rounded-sm px-1 py-0.5 bg-paper"
                />
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax (18%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-line mt-2">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-muted mb-1.5">Payment</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["cash", "card", "wallet"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 rounded-sm border text-xs capitalize transition-colors ${
                      paymentMethod === m
                        ? "border-accent bg-accent text-paper"
                        : "border-line hover:border-accent"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <div
                className={`mt-3 text-xs px-3 py-2 rounded-sm ${
                  message.type === "error"
                    ? "text-rust bg-rust/5 border border-rust/30"
                    : "text-accent bg-accent/5 border border-accent/30"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={checkout}
              disabled={cart.length === 0 || checkingOut}
              className="w-full mt-4 bg-accent text-paper font-sans font-medium py-3 rounded-sm hover:bg-accentDark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {checkingOut ? "Processing..." : `Charge ₹${total.toFixed(2)}`}
            </button>
          </div>
          <div className="tape-edge" />
        </div>

        {lastOrder && (
          <div className="mt-3 text-xs text-muted font-tape px-1">
            Last receipt: <span className="text-ink">{lastOrder.orderNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}
