import { useEffect, useMemo, useState, useRef } from "react";
import api from "../services/api";
import { socket } from "../services/socket";

const activeStatuses = ["new", "preparing", "ready"];
const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const labels = { new: "New Order", preparing: "Preparing", ready: "Ready to Serve" };
const colors = { 
  new: "bg-red-500/20 text-red-400 border border-red-500/30", 
  preparing: "bg-amber-500/20 text-amber-400 border border-amber-500/30", 
  ready: "bg-brand-500/30 text-brand-300 border border-brand-500/40" 
};

function upsertOrder(current, order) {
  const exists = current.some((item) => item._id === order._id);
  const next = activeStatuses.includes(order.status) ? (exists ? current.map((item) => item._id === order._id ? order : item) : [...current, order]) : current.filter((item) => item._id !== order._id);
  return next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Noticeable but pleasant kitchen bell
  const audioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg"));

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Autoplay prevented", e));
    }
  };

  useEffect(() => {
    api.get("/api/orders")
      .then(({ data }) => setOrders((data.data || []).filter((order) => activeStatuses.includes(order.status)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))))
      .catch(() => setError("Could not load kitchen orders."))
      .finally(() => setLoading(false));
      
    const syncOrder = (order) => {
      setOrders((current) => {
        const exists = current.some((item) => item._id === order._id);
        if (!exists && order.status === "new") playSound();
        return upsertOrder(current, order);
      });
    };
    
    socket.on("order:new", syncOrder);
    socket.on("order:updated", syncOrder);
    socket.connect();
    
    return () => { 
      socket.off("order:new", syncOrder); 
      socket.off("order:updated", syncOrder); 
      socket.disconnect(); 
    };
  }, [soundEnabled]);

  const visibleOrders = useMemo(() => filter === "all" ? orders : orders.filter((order) => order.status === filter), [orders, filter]);
  
  async function changeStatus(order, status) {
    setUpdatingId(order._id);
    try {
      const { data } = await api.patch(`/api/orders/${order._id}/status`, { status });
      setOrders((current) => upsertOrder(current, data.data));
    } catch {
      setError("Could not update this order. Please try again.");
    } finally {
      setUpdatingId("");
    }
  }

  const toggleSound = () => {
    setSoundEnabled(prev => {
      if (!prev) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      }
      return !prev;
    });
  };

  return (
    <section className="space-y-8">
      {/* Dashboard Header */}
      <header className="glass-panel p-6 sm:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/10 blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-1">Command Center</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Kitchen Dashboard</h1>
            <p className="mt-2 text-sm text-cream-muted">Live incoming orders. Ensure smooth prep.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSound}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-inner border ${soundEnabled ? 'bg-brand-500/20 text-brand-300 border-brand-500/50' : 'bg-brand-900/50 text-cream-muted border-white/10'}`}
              title="New Order Chime"
            >
              <span className="text-xl">{soundEnabled ? "🔊" : "🔇"}</span>
              <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Sound Off"}</span>
            </button>
            
            <div className="glass-card px-6 py-3 flex items-center gap-4">
              <div>
                <p className="text-3xl font-bold text-accent-gold leading-none drop-shadow-md">{orders.length}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-cream-muted mt-1">Active</p>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div>
                <p className="text-xl font-bold text-red-400 leading-none">{orders.filter(o => o.status === 'new').length}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-cream-muted mt-1">New</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {[["all", "All Orders"], ["new", "New"], ["preparing", "Preparing"], ["ready", "Ready to Serve"]].map(([value, label]) => (
          <button 
            key={value} 
            onClick={() => setFilter(value)} 
            className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${filter === value ? "bg-gradient-to-r from-accent-gold to-accent-amber text-brand-900 shadow-[0_5px_15px_rgba(214,166,77,0.2)] scale-105" : "glass-card text-cream-muted hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Error & Loading States */}
      {loading && <div className="grid min-h-[300px] place-items-center glass-card text-cream-muted animate-pulse font-medium">Loading active kitchen tickets…</div>}
      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5 text-sm font-bold text-red-400 backdrop-blur-md">{error}</div>}
      {!loading && !visibleOrders.length && (
        <div className="grid min-h-[300px] place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-brand-900/30 text-cream-muted font-medium">
          <div className="text-center">
            <p className="text-4xl mb-4">🍳</p>
            <p>No {filter === "all" ? "active" : labels[filter].toLowerCase()} orders right now.</p>
            <p className="text-xs text-cream-muted/50 mt-2">Kitchen is clear</p>
          </div>
        </div>
      )}
      
      {/* Order Grid (Segmented Kanban style for large screens) */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 items-start">
        {visibleOrders.map((order) => (
          <article 
            key={order._id} 
            className={`relative rounded-3xl p-6 transition-all duration-300 shadow-xl ${order.status === 'new' ? 'bg-brand-800/90 border border-red-500/30 hover:border-red-500/50 hover:shadow-[0_10px_30px_rgba(248,113,113,0.1)]' : 'glass-card'}`}
          >
            {/* Status indicator strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl ${order.status === 'new' ? 'bg-red-500' : order.status === 'preparing' ? 'bg-amber-500' : 'bg-brand-400'}`}></div>
            
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <span className="inline-block bg-white/10 text-white font-mono text-xs px-2 py-1 rounded mb-2 tracking-wider">
                  #{order.orderCode}
                </span>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Table {order.tableNumber}
                </h2>
                <p className="mt-1 text-xs font-medium text-cream-muted/70 flex items-center gap-1">
                  🕒 {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${colors[order.status]}`}>
                {labels[order.status]}
              </span>
            </div>
            
            <div className="rounded-xl bg-brand-900/60 border border-white/5 p-4 mb-6">
              <div className="divide-y divide-white/10">
                {order.items.map((item) => (
                  <div key={`${item.name}-${item.price}`} className="flex justify-between items-center py-2.5 group">
                    <div className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded bg-accent-gold/20 text-accent-gold text-xs font-bold border border-accent-gold/30">
                        {item.quantity}
                      </span>
                      <span className="font-bold text-cream-base text-sm group-hover:text-white transition-colors">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-cream-muted block text-xs uppercase tracking-wider mb-0.5">Items</span>
                <span className="font-bold text-white">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              
              {order.status === "new" && (
                <button 
                  disabled={updatingId === order._id} 
                  onClick={() => changeStatus(order, "preparing")} 
                  className="bg-amber-500 hover:bg-amber-400 text-brand-900 px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="text-lg">🔥</span> Start Prep
                </button>
              )}
              
              {order.status === "preparing" && (
                <button 
                  disabled={updatingId === order._id} 
                  onClick={() => changeStatus(order, "ready")} 
                  className="bg-brand-500 hover:bg-brand-400 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="text-lg">✅</span> Mark Ready
                </button>
              )}
              
              {order.status === "ready" && (
                <span className="bg-brand-800/80 border border-brand-500/30 text-brand-300 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                  <span className="text-lg animate-pulse">🛎️</span> Awaiting Waiter
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
