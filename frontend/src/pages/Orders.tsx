import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Order {
  id: number;
  orderNumber: string;
  cashier: { name: string };
  total: number;
  paymentMethod: string;
  status: "completed" | "refunded";
  createdAt: string;
  lineItems: { name: string; quantity: number }[];
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = async () => {
    const { data } = await client.get("/orders", { params: { limit: 30 } });
    setOrders(data.items);
  };

  useEffect(() => {
    load();
  }, []);

  const refund = async (id: number) => {
    if (!confirm("Refund this order and restore stock?")) return;
    await client.post(`/orders/${id}/refund`);
    load();
  };

  const canRefund = user?.role === "manager" || user?.role === "admin";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-tape text-lg font-semibold mb-6">Order History</h1>

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border border-line rounded-sm bg-white/40 px-4 py-3 font-tape text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{o.orderNumber}</span>
                <span className="text-muted"> · {new Date(o.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs uppercase px-2 py-0.5 rounded-sm ${
                    o.status === "refunded" ? "bg-rust/10 text-rust" : "bg-accent/10 text-accent"
                  }`}
                >
                  {o.status}
                </span>
                <span className="font-semibold">₹{o.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-xs text-muted mt-1">
              {o.lineItems.map((li) => `${li.name} ×${li.quantity}`).join(", ")}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center justify-between">
              <span>
                Cashier: {o.cashier?.name} · {o.paymentMethod}
              </span>
              {canRefund && o.status === "completed" && (
                <button onClick={() => refund(o.id)} className="text-rust hover:underline">
                  Refund
                </button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-muted text-sm">No orders yet.</div>}
      </div>
    </div>
  );
}
