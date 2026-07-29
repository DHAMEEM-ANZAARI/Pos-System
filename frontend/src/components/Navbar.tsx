import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
      isActive ? "border-accent text-accent" : "border-transparent text-ink/60 hover:text-ink"
    }`;

  return (
    <header className="border-b border-line bg-paper sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <div className="font-tape text-lg font-semibold tracking-tight">
            COUNTER<span className="text-accent">·</span>POS
          </div>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkClass}>
              Terminal
            </NavLink>
            {(user.role === "manager" || user.role === "admin") && (
              <>
                <NavLink to="/products" className={linkClass}>
                  Catalog
                </NavLink>
                <NavLink to="/inventory" className={linkClass}>
                  Inventory
                </NavLink>
              </>
            )}
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs uppercase tracking-wide text-muted">{user.role}</div>
          </div>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded border border-line hover:border-rust hover:text-rust transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};
