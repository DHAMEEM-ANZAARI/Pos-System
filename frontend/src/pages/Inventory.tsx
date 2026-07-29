import { useEffect, useState } from "react";
import client from "../api/client";

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  reorderPoint: number;
}

export default function Inventory() {
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await client.get("/products/low-stock");
    setLowStock(data.items);
  };

  useEffect(() => {
    load();
  }, []);

  const restock = async (productId: number) => {
    const qty = Number(restockQty[productId] || 0);
    if (qty <= 0) return;
    await client.post("/inventory/restock", { productId, quantity: qty });
    setRestockQty((r) => ({ ...r, [productId]: "" }));
    setMessage(`Restocked +${qty} units`);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-tape text-lg font-semibold mb-1">Inventory — Low Stock Alerts</h1>
      <p className="text-sm text-muted mb-6">
        Products at or below their reorder point. Restock directly from here.
      </p>

      {message && (
        <div className="mb-4 text-xs text-accent bg-accent/5 border border-accent/30 px-3 py-2 rounded-sm inline-block">
          {message}
        </div>
      )}

      <div className="border border-line rounded-sm overflow-hidden bg-white/40">
        <table className="w-full text-sm font-tape">
          <thead className="bg-line/30 text-xs uppercase text-muted">
            <tr>
              <th className="text-left px-3 py-2">Product</th>
              <th className="text-left px-3 py-2">SKU</th>
              <th className="text-right px-3 py-2">Stock</th>
              <th className="text-right px-3 py-2">Reorder pt.</th>
              <th className="text-right px-3 py-2">Restock</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((p) => (
              <tr key={p.id} className="border-t border-line/60">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2 text-muted">{p.sku}</td>
                <td className="px-3 py-2 text-right text-rust font-semibold">{p.stock}</td>
                <td className="px-3 py-2 text-right text-muted">{p.reorderPoint}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={restockQty[p.id] || ""}
                      onChange={(e) => setRestockQty((r) => ({ ...r, [p.id]: e.target.value }))}
                      className="w-16 border border-line bg-paper px-2 py-1 rounded-sm text-right"
                    />
                    <button
                      onClick={() => restock(p.id)}
                      className="text-accent hover:underline text-xs"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {lowStock.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">
                  All products are above their reorder point.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
