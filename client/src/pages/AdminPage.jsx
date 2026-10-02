import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { socket } from "../services/socket";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const statusStyles = { 
  available: "bg-brand-900/50 text-cream-muted border border-white/10 shadow-inner", 
  occupied: "bg-accent-gold/20 text-accent-gold border border-accent-gold/30 shadow-[0_0_10px_rgba(214,166,77,0.2)]", 
  food_ready: "bg-brand-500/30 text-brand-300 border border-brand-500/40 shadow-[0_0_10px_rgba(34,112,81,0.2)]", 
  billing: "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  
  const loadDashboard = () => api.get("/api/dashboard")
    .then(({ data }) => { setDashboard(data.data); setError(""); })
    .catch(() => setError("Could not load the owner dashboard."));

  useEffect(() => {
    loadDashboard();
    socket.on("dashboard:updated", loadDashboard);
    socket.on("order:updated", loadDashboard);
    socket.on("table:updated", loadDashboard);
    socket.connect();
    
    return () => { 
      socket.off("dashboard:updated", loadDashboard); 
      socket.off("order:updated", loadDashboard); 
      socket.off("table:updated", loadDashboard); 
      socket.disconnect(); 
    };
  }, []);

  if (!dashboard && !error) return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="w-16 h-16 rounded-full border-4 border-accent-gold border-t-transparent animate-spin"></div>
        <p className="text-cream-muted font-medium tracking-wide">Compiling business analytics...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="rounded-3xl bg-red-500/10 border border-red-500/30 p-8 text-center mt-10">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-red-400 font-bold">{error}</p>
    </div>
  );
  
  const cards = [
    { label: "Today's Revenue", value: money(dashboard.revenue), note: "Paid, completed orders", icon: "💎", highlight: true }, 
    { label: "Total Orders", value: dashboard.totalOrders, note: "All time records", icon: "📊" }, 
    { label: "Active Orders", value: dashboard.activeOrders, note: "Currently in service", icon: "🔥" }, 
    { label: "Occupied Tables", value: dashboard.occupiedTables, note: "Seated guests", icon: "🪑" }
  ];

  return (
    <section className="space-y-8 pb-12">
      {/* Dashboard Header */}
      <header className="glass-panel p-6 sm:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="inline-block px-3 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/10 text-accent-gold text-xs font-bold tracking-[0.2em] uppercase mb-4 shadow-inner">
              Khwaja Garib Nawaz
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-md">Owner Dashboard</h1>
            <p className="mt-3 text-sm text-cream-muted font-medium">A live snapshot of today's restaurant performance.</p>
          </div>
          
          <Link to="/admin/qr" className="accent-btn text-sm hover:scale-105 active:scale-95 group">
            <span className="text-lg group-hover:animate-pulse">📱</span> Table QR Codes
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article 
            key={card.label} 
            className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${card.highlight ? 'bg-gradient-to-br from-brand-800 to-brand-700 border border-accent-gold/30 hover:border-accent-gold/60' : 'glass-card'}`}
          >
            {card.highlight && <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-cream-muted/70">{card.label}</p>
                <span className="text-2xl drop-shadow-md">{card.icon}</span>
              </div>
              <p className={`mt-auto text-4xl font-bold ${card.highlight ? 'text-accent-gold drop-shadow-md' : 'text-white'}`}>
                {card.value}
              </p>
              <p className="mt-3 text-xs text-cream-muted/60 font-medium">{card.note}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Table Overview */}
        <section className="glass-panel p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[50px] pointer-events-none"></div>
          <div className="relative z-10 mb-6 flex justify-between items-end border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-gold/80 mb-1">Dining Room</p>
              <h2 className="text-2xl font-bold text-white tracking-wide">Floor Overview</h2>
            </div>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-gold/50 shadow-[0_0_5px_rgba(214,166,77,0.5)]"></span>
              <span className="h-2 w-2 rounded-full bg-brand-500/50 shadow-[0_0_5px_rgba(34,112,81,0.5)]"></span>
              <span className="h-2 w-2 rounded-full bg-purple-500/50 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {dashboard.tables.map((table) => (
              <article key={table._id} className="relative rounded-xl bg-brand-900/50 border border-white/5 p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-brand-900 hover:border-white/10 group shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
                <p className="font-bold text-white text-lg relative z-10 mb-3">T{table.tableNumber}</p>
                <span className={`relative z-10 w-full rounded-md py-1.5 text-[10px] font-bold uppercase tracking-widest ${statusStyles[table.status]}`}>
                  {table.status.replace("_", " ")}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* Best Seller Spotlight */}
        <section className="glass-panel p-6 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10 mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-gold/80 mb-1">Analytics Spotlight</p>
            <h2 className="text-2xl font-bold text-white tracking-wide">Top Performer</h2>
          </div>
          
          {dashboard.bestSellingItem ? (
            <div className="relative z-10 mt-auto rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 border border-accent-gold/30 p-8 text-center flex-1 flex flex-col justify-center group hover:shadow-[0_15px_40px_rgba(214,166,77,0.15)] transition-all">
              <div className="absolute top-0 right-0 bg-accent-gold text-brand-900 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">#1</div>
              <div className="text-5xl mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform">🏆</div>
              <p className="text-2xl font-bold text-accent-gold glow-text leading-tight mb-2">{dashboard.bestSellingItem.name}</p>
              <div className="h-px w-16 bg-white/20 mx-auto my-4"></div>
              <p className="text-sm text-cream-muted font-medium">
                <span className="text-white font-bold text-lg">{dashboard.bestSellingItem.quantity}</span> sold in completed orders
              </p>
            </div>
          ) : (
            <div className="relative z-10 mt-auto rounded-2xl border-2 border-dashed border-white/10 bg-brand-900/30 p-8 text-center flex-1 flex flex-col justify-center items-center">
              <span className="text-3xl opacity-50 mb-3">📊</span>
              <p className="text-sm font-medium text-cream-muted leading-relaxed max-w-[200px]">Data compiling. Sales will appear after the first bill is paid.</p>
            </div>
          )}
        </section>
      </div>

      {/* Recent Orders Table */}
      <section className="glass-panel p-6 sm:p-8 shadow-lg">
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-white/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-gold/80 mb-1">Live Feed</p>
            <h2 className="text-2xl font-bold text-white tracking-wide">Recent Transactions</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5 bg-brand-900/50 shadow-inner">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-brand-900/80 text-xs uppercase tracking-wider text-cream-muted border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-xl">Order Code</th>
                <th className="px-6 py-4 font-semibold">Table</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Order Status</th>
                <th className="px-6 py-4 font-semibold rounded-tr-xl">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dashboard.recentOrders.map((order) => (
                <tr key={order._id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-white bg-white/5 px-2 py-1 rounded">{order.orderCode}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-cream-base">T{order.tableNumber}</td>
                  <td className="px-6 py-4 font-bold text-accent-gold">{money(order.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'completed' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' :
                      order.status === 'new' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-amber-400 shadow-[0_0_5px_#fbbf24]'}`}></span>
                      <span className="capitalize font-medium text-cream-base">
                        {order.paymentStatus}
                        {order.paymentMethod ? <span className="text-cream-muted text-xs ml-1 font-normal">via {order.paymentMethod.toUpperCase()}</span> : ""}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!dashboard.recentOrders.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm font-medium text-cream-muted">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
