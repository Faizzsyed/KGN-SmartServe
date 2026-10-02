import { useEffect, useMemo, useState, useRef } from "react";
import api from "../services/api";
import { socket } from "../services/socket";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const requestLabels = { water: "Water", extra_plate: "Extra plate", tissue: "Tissue", call_waiter: "Call waiter", bill: "Bill" };
const requestIcons = { water: "💧", extra_plate: "🍽️", tissue: "🧻", call_waiter: "🛎️", bill: "🧾" };

const statusStyles = { 
  available: "bg-brand-900/50 text-cream-muted border-white/10", 
  occupied: "bg-accent-gold/20 text-accent-gold border-accent-gold/30", 
  food_ready: "bg-brand-500/30 text-brand-300 border-brand-500/40", 
  billing: "bg-purple-500/20 text-purple-300 border-purple-500/30" 
};

const upsert = (list, item) => list.some((entry) => entry._id === item._id) ? list.map((entry) => entry._id === item._id ? item : entry) : [item, ...list];

function BillModal({ order, busy, onClose, onPay }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-brand-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Container */}
      <section className="relative z-10 flex flex-col w-full max-w-[560px] max-h-[85vh] rounded-3xl bg-brand-800 shadow-[0_10px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden" style={{animation: 'fadeInUp 0.3s ease-out forwards'}}>
        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 blur-[40px] pointer-events-none"></div>
        
        {/* Header - Fixed at top */}
        <div className="relative z-10 flex justify-between items-start p-6 sm:px-8 sm:pt-8 sm:pb-6 border-b border-white/10 bg-brand-800 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-1">Khwaja Garib Nawaz</p>
            <h2 className="text-2xl font-bold text-white mb-2">Order Receipt</h2>
            <div className="flex items-center gap-3">
              <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono tracking-wider text-white">#{order.orderCode}</span>
              <span className="text-sm font-bold text-brand-300">Table {order.tableNumber}</span>
            </div>
            <p className="text-xs text-cream-muted mt-2">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 shrink-0 rounded-full glass-card flex items-center justify-center text-xl text-cream-muted hover:text-white hover:bg-white/10 transition-colors">✕</button>
        </div>
        
        {/* Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 sm:px-8">
          <div className="divide-y divide-white/5 bg-brand-900/50 rounded-xl p-4 border border-white/5">
            {order.items.map((item) => (
              <div key={`${item.name}-${item.price}`} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-sm items-center">
                <span className="font-bold text-cream-base">{item.name}</span>
                <span className="text-cream-muted bg-white/5 px-2 py-1 rounded">{item.quantity} × {money(item.price)}</span>
                <span className="font-bold text-white text-right">{money(item.quantity * item.price)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer - Fixed at bottom */}
        <div className="relative z-10 p-6 sm:px-8 sm:pb-8 sm:pt-6 bg-brand-800 border-t border-white/10 shrink-0">
          <div className="flex justify-between items-center text-sm font-bold text-cream-muted mb-2 px-2">
            <span>Subtotal</span>
            <span>{money(order.total)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-white px-4 py-3 bg-brand-900/80 rounded-xl border border-accent-gold/20 mb-6">
            <span>Grand Total</span>
            <span className="text-accent-gold text-2xl drop-shadow-md">{money(order.total)}</span>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <button disabled={busy} onClick={() => onPay("cash")} className="rounded-xl bg-brand-700/80 hover:bg-brand-600 border border-brand-500/30 px-4 py-4 text-sm font-bold text-white transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              💵 PAID BY CASH
            </button>
            <button disabled={busy} onClick={() => onPay("upi")} className="rounded-xl bg-gradient-to-r from-accent-gold to-accent-amber px-4 py-4 text-sm font-bold text-brand-900 shadow-[0_5px_15px_rgba(214,166,77,0.3)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              📱 PAID VIA UPI
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function WaiterPage() {
  const [tables, setTables] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [requests, setRequests] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 
  const [busyId, setBusyId] = useState(""); 
  const [billOrder, setBillOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Distinct sounds for waiter events
  const readyAudioRef = useRef(new Audio("https://actions.google.com/sounds/v1/water/glass_clink.ogg"));
  const requestAudioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));

  useEffect(() => {
    Promise.all([api.get("/api/tables"), api.get("/api/orders"), api.get("/api/service-requests")])
      .then(([tableResult, orderResult, requestResult]) => { 
        setTables(tableResult.data.data || []); 
        setOrders(orderResult.data.data || []); 
        setRequests(requestResult.data.data || []); 
      })
      .catch(() => setError("Could not load waiter controls."))
      .finally(() => setLoading(false));
      
    const table = (item) => setTables((list) => upsert(list, item).sort((a, b) => a.tableNumber - b.tableNumber)); 
    
    const order = (item) => setOrders((list) => {
      const exists = list.some(o => o._id === item._id);
      if (item.status === 'ready' && !exists || (exists && list.find(o => o._id === item._id)?.status !== 'ready')) {
        if (soundEnabled && readyAudioRef.current) {
          readyAudioRef.current.currentTime = 0;
          readyAudioRef.current.play().catch(()=>{});
        }
      }
      return upsert(list, item);
    }); 
    
    const request = (item) => setRequests((list) => {
      const exists = list.some(r => r._id === item._id);
      if (!exists && item.status === 'pending') {
        if (soundEnabled && requestAudioRef.current) {
          requestAudioRef.current.currentTime = 0;
          requestAudioRef.current.play().catch(()=>{});
        }
      }
      return upsert(list, item);
    });
    
    socket.on("table:updated", table); 
    socket.on("order:new", order); 
    socket.on("order:updated", order); 
    socket.on("service:new", request); 
    socket.on("service:updated", request); 
    socket.connect();
    
    return () => { 
      socket.off("table:updated", table); 
      socket.off("order:new", order); 
      socket.off("order:updated", order); 
      socket.off("service:new", request); 
      socket.off("service:updated", request); 
      socket.disconnect(); 
    };
  }, [soundEnabled]);

  const readyOrders = useMemo(() => orders.filter((order) => order.status === "ready"), [orders]);
  const pendingRequests = useMemo(() => requests.filter((request) => request.status === "pending"), [requests]);
  const billingOrders = useMemo(() => tables.filter((table) => table.status === "billing").map((table) => orders.filter((order) => order.tableNumber === table.tableNumber && order.paymentStatus === "pending").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]).filter(Boolean), [tables, orders]);
  const currentOrder = (tableNumber) => orders.filter((order) => order.tableNumber === tableNumber && order.status !== "completed").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  
  async function patch(path, body, message) { 
    try { 
      const { data } = await api.patch(path, body); 
      return data.data; 
    } catch { 
      setError(message); 
      return null; 
    } 
  }
  
  async function serve(order) { 
    setBusyId(order._id); 
    const updated = await patch(`/api/orders/${order._id}/status`, { status: "served" }, "Could not mark the order served."); 
    if (updated) setOrders((list) => upsert(list, updated)); 
    setBusyId(""); 
  }
  
  async function done(request) { 
    setBusyId(request._id); 
    const updated = await patch(`/api/service-requests/${request._id}/complete`, {}, "Could not complete the request."); 
    if (updated) setRequests((list) => upsert(list, updated)); 
    setBusyId(""); 
  }
  
  async function pay(method) { 
    if (!billOrder) return; 
    setBusyId(billOrder._id); 
    const updated = await patch(`/api/orders/${billOrder._id}/payment`, { paymentMethod: method }, "Could not complete the payment."); 
    if (updated) { setOrders((list) => upsert(list, updated)); setBillOrder(null); } 
    setBusyId(""); 
  }

  const toggleSound = () => {
    setSoundEnabled(prev => {
      if (!prev) {
        readyAudioRef.current.volume = 0.5;
        readyAudioRef.current.play().catch(() => {});
      }
      return !prev;
    });
  };

  const Empty = ({ children, icon }) => (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/10 bg-brand-900/30 text-center">
      <span className="text-3xl mb-3 opacity-50">{icon || "✨"}</span>
      <p className="text-sm font-medium text-cream-muted">{children}</p>
    </div>
  );

  return (
    <section className="space-y-10 pb-10">
      <header className="glass-panel p-6 sm:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-1">Service Hub</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Waiter Control</h1>
            <p className="mt-2 text-sm text-cream-muted">Manage tables, ready dishes, requests, and billing.</p>
          </div>
          
          <button 
            onClick={toggleSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-inner border ${soundEnabled ? 'bg-brand-500/20 text-brand-300 border-brand-500/50' : 'bg-brand-900/50 text-cream-muted border-white/10'}`}
            title="Service Notifications"
          >
            <span className="text-xl">{soundEnabled ? "🔊" : "🔇"}</span>
            <span className="hidden sm:inline">{soundEnabled ? "Alerts On" : "Alerts Off"}</span>
          </button>
        </div>
      </header>

      {loading && <div className="grid min-h-[300px] place-items-center glass-card text-cream-muted animate-pulse font-medium">Loading service dashboard…</div>}
      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5 text-sm font-bold text-red-400 backdrop-blur-md">{error}</div>}
      
      {!loading && (
        <div className="space-y-12">
          
          {/* Priority Section: Food Ready */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white tracking-wide">Ready to Serve</h2>
              {readyOrders.length > 0 && <span className="bg-brand-500/30 border border-brand-400/50 text-brand-300 px-3 py-1 rounded-full text-sm font-bold shadow-inner">{readyOrders.length}</span>}
            </div>
            
            {readyOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {readyOrders.map((order) => (
                  <article key={order._id} className="relative rounded-2xl glass-card p-5 border-l-4 border-l-brand-400 hover:shadow-[0_10px_30px_rgba(34,112,81,0.2)] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-white">Table {order.tableNumber}</h3>
                      <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono tracking-wider text-cream-muted">#{order.orderCode}</span>
                    </div>
                    
                    <div className="bg-brand-900/50 rounded-lg p-3 mb-4 max-h-24 overflow-y-auto no-scrollbar border border-white/5">
                      <p className="text-sm font-medium text-cream-base leading-relaxed">
                        {order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}
                      </p>
                    </div>
                    
                    <button disabled={busyId === order._id} onClick={() => serve(order)} className="w-full bg-brand-500 hover:bg-brand-400 text-white rounded-xl px-4 py-3 text-sm font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      🍽️ MARK SERVED
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <Empty icon="⏳">No dishes waiting to be served.</Empty>
            )}
          </section>

          {/* Service Requests */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white tracking-wide">Customer Requests</h2>
              {pendingRequests.length > 0 && <span className="bg-accent-gold/20 border border-accent-gold/40 text-accent-gold px-3 py-1 rounded-full text-sm font-bold shadow-inner">{pendingRequests.length}</span>}
            </div>
            
            {pendingRequests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingRequests.map((request) => (
                  <article key={request._id} className="flex flex-col gap-4 rounded-2xl glass-card p-5 border-t-2 border-t-accent-gold hover:shadow-[0_8px_25px_rgba(214,166,77,0.15)] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent-gold/20 border border-accent-gold/30 text-accent-gold font-bold text-lg shadow-inner">
                        {request.tableNumber}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white flex items-center gap-2">
                          <span className="text-lg">{requestIcons[request.type]}</span>
                          {requestLabels[request.type]}
                        </p>
                        <p className="text-xs font-medium text-cream-muted/70 mt-1">
                          {new Date(request.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <button disabled={busyId === request._id} onClick={() => done(request)} className="w-full rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50">
                      ✓ MARK DONE
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <Empty icon="🛎️">No pending customer requests.</Empty>
            )}
          </section>

          {/* Billing Queue */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white tracking-wide">Billing Queue</h2>
              {billingOrders.length > 0 && <span className="bg-purple-500/30 border border-purple-400/50 text-purple-300 px-3 py-1 rounded-full text-sm font-bold shadow-inner">{billingOrders.length}</span>}
            </div>
            
            {billingOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {billingOrders.map((order) => (
                  <article key={order._id} className="rounded-2xl glass-card p-5 border-l-4 border-l-purple-500 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">Table {order.tableNumber}</h3>
                        <p className="text-xs font-mono text-cream-muted tracking-wider mt-1">#{order.orderCode}</p>
                      </div>
                      <p className="font-bold text-xl text-accent-gold drop-shadow-sm">{money(order.total)}</p>
                    </div>
                    <button onClick={() => setBillOrder(order)} className="w-full rounded-xl bg-purple-600/80 hover:bg-purple-500 border border-purple-400/50 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                      🧾 PROCESS BILL
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <Empty icon="💳">No tables are awaiting payment.</Empty>
            )}
          </section>

          {/* Table Overview Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white tracking-wide">Floor Overview</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {tables.map((table) => { 
                const order = currentOrder(table.tableNumber); 
                return (
                  <article key={table._id} className="relative overflow-hidden rounded-2xl glass-card p-5 transition-all hover:border-white/20 hover:shadow-lg group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                    <p className="text-2xl font-bold text-white mb-3">T{table.tableNumber}</p>
                    <span className={`inline-block border rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[table.status]}`}>
                      {table.status.replace("_", " ")}
                    </span>
                    {order && <p className="mt-4 font-mono text-xs font-medium text-cream-muted/70 tracking-wider">#{order.orderCode}</p>}
                  </article>
                ); 
              })}
            </div>
          </section>
        </div>
      )}
      
      {billOrder && <BillModal order={billOrder} busy={busyId === billOrder._id} onClose={() => setBillOrder(null)} onPay={pay} />}
    </section>
  );
}
