import { NavLink, Outlet, useLocation } from "react-router-dom";

const links = [
  ["/menu", "Menu"],
  ["/kitchen", "Kitchen"],
  ["/waiter", "Waiter"],
  ["/admin", "Owner"],
];

export default function Layout() {
  const location = useLocation();
  const isCustomerFlow = location.pathname.startsWith("/menu") || location.pathname.startsWith("/order");

  if (isCustomerFlow) return <Outlet />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-900/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3 font-semibold tracking-tight group">
            <div className="relative">
              <div className="absolute -inset-1 bg-accent-gold rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-gold to-accent-amber text-lg text-brand-900 shadow-lg font-bold">K</span>
            </div>
            <span className="text-xl text-cream-base tracking-wide">KGN <span className="text-accent-gold font-light">SmartServe</span></span>
          </NavLink>
          <nav className="flex items-center gap-2 overflow-x-auto text-sm font-medium no-scrollbar p-1">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-lg px-4 py-2 transition-all duration-300 ${isActive ? "bg-white/10 text-accent-amber shadow-inner border border-white/5" : "text-cream-muted hover:bg-white/5 hover:text-cream-base"}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><Outlet /></main>
      <footer className="border-t border-white/5 mt-auto px-4 py-6 text-center text-sm text-cream-muted/50 font-light">
        <p>Khwaja Garib Nawaz <span className="text-accent-gold/50 mx-2">◆</span> Premium Restaurant Operations</p>
      </footer>
    </div>
  );
}
