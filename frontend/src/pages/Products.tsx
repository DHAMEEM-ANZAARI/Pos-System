import { useEffect, useState, FormEvent } from "react";
import client from "../api/client";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderPoint: number;
  size?: string | null;
  color?: string | null;
}

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  costPrice: "",
  stock: "",
  reorderPoint: "5",
  size: "",
  color: "",
};

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await client.get("/products", { params: { search, limit: 50 } });
    setItems(data.items);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: String(p.price),
      costPrice: String(p.costPrice),
      stock: String(p.stock),
      reorderPoint: String(p.reorderPoint),
      size: p.size || "",
      color: p.color || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      costPrice: Number(form.costPrice) || 0,
      stock: Number(form.stock),
      reorderPoint: Number(form.reorderPoint) || 5,
      variant: { size: form.size || undefined, color: form.color || undefined },
    };
    try {
      if (editingId) {
        await client.put(`/products/${editingId}`, payload);
      } else {
        await client.post("/products", payload);
      }
      resetForm();
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Save failed");
    }
  };

  const deactivate = async (id: number) => {
    if (!confirm("Deactivate this product?")) return;
    await client.delete(`/products/${id}`);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-tape text-lg font-semibold">Product Catalog</h1>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-line bg-white/50 px-3 py-1.5 rounded-sm text-sm w-56"
          />
        </div>

        <div className="border border-line rounded-sm overflow-hidden bg-white/40">
          <table className="w-full text-sm font-tape">
            <thead className="bg-line/30 text-xs uppercase text-muted">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">SKU</th>
                <th className="text-right px-3 py-2">Price</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-line/60">
                  <td className="px-3 py-2">
                    {p.name}
                    {(p.size || p.color) && (
                      <span className="text-muted"> · {[p.color, p.size].filter(Boolean).join(" ")}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted">{p.sku}</td>
                  <td className="px-3 py-2 text-right">₹{p.price.toFixed(2)}</td>
                  <td className={`px-3 py-2 text-right ${p.stock <= p.reorderPoint ? "text-rust font-semibold" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button onClick={() => startEdit(p)} className="text-accent hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deactivate(p.id)} className="text-rust hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-6">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="border border-line rounded-sm bg-white/60 p-5 sticky top-24">
          <h2 className="font-tape text-sm font-semibold mb-3">
            {editingId ? "Edit product" : "Add new product"}
          </h2>
          <form onSubmit={submit} className="space-y-3 text-sm font-tape">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-line bg-paper px-3 py-2 rounded-sm" />
            <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full border border-line bg-paper px-3 py-2 rounded-sm" />
            <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-line bg-paper px-3 py-2 rounded-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="border border-line bg-paper px-3 py-2 rounded-sm" />
              <input placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="border border-line bg-paper px-3 py-2 rounded-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-line bg-paper px-3 py-2 rounded-sm" />
              <input type="number" step="0.01" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="border border-line bg-paper px-3 py-2 rounded-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border border-line bg-paper px-3 py-2 rounded-sm" />
              <input type="number" placeholder="Reorder pt." value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} className="border border-line bg-paper px-3 py-2 rounded-sm" />
            </div>

            {error && <div className="text-rust text-xs">{error}</div>}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-accent text-paper font-sans font-medium py-2 rounded-sm hover:bg-accentDark">
                {editingId ? "Save changes" : "Add product"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-3 border border-line rounded-sm text-xs">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
