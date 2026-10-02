import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { socket } from "../services/socket";

const stages = ["Order Received", "Preparing", "Ready", "Served"];
const stageIndex = { new: 0, preparing: 1, ready: 2, served: 3, completed: 3 };
const serviceOptions = [
  { type: "water", label: "Water", icon: "💧" },
  { type: "extra_plate", label: "Extra Plate", icon: "🍽️" },
  { type: "tissue", label: "Tissue", icon: "🧻" },
  { type: "call_waiter", label: "Call Waiter", icon: "🛎️" },
  { type: "bill", label: "Request Bill", icon: "🧾" }
];
const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export default function OrderStatusPage() {
  const { orderId: routeOrderId } = useParams();
  const orderId = routeOrderId || localStorage.getItem("kgnLastOrder");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingType, setRequestingType] = useState("");
  const [serviceMessage, setServiceMessage] = useState("");

  useEffect(() => {
    if (!orderId) { setError("Order not found"); setLoading(false); return; }
    let active = true;
    api.get(`/api/orders/${orderId}`)
      .then(({ data }) => { if (active) setOrder(data.data); })
      .catch((requestError) => { if (active) setError(requestError.response?.status === 404 ? "Order not found" : "We could not load this order."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return undefined;
    const updateOrder = (updatedOrder) => { if (updatedOrder?._id === orderId) setOrder(updatedOrder); };
    socket.on("order:new", updateOrder);
    socket.on("order:updated", updateOrder);
    socket.connect();
    return () => { socket.off("order:new", updateOrder); socket.off("order:updated", updateOrder); socket.disconnect(); };
  }, [orderId]);

  async function requestService(type) {
    if (!order || requestingType) return;
    setRequestingType(type);
    setServiceMessage("");
    try { 
      await api.post("/api/service-requests", { tableNumber: order.tableNumber, type }); 
      setServiceMessage("Request sent to waiter.");
      setTimeout(() => setServiceMessage(""), 5000);
    }
    catch { setServiceMessage("Could not send the request. Please try again."); }
    finally { setRequestingType(""); }
  }

  if (loading) return (
    <main className="grid min-h-[80vh] place-items-center">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="w-16 h-16 rounded-full border-4 border-accent-gold border-t-transparent animate-spin"></div>
        <p className="text-cream-muted font-medium tracking-wide">Syncing with kitchen...</p>
      </div>
    </main>
  );

  if (error || !order) return (
    <main className="grid min-h-[80vh] place-items-center p-5 text-center">
      <section className="glass-panel p-10 max-w-sm w-full animate-float">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-2">KGN SmartServe</p>
        <h1 className="text-2xl font-bold text-white mb-8">{error || "Order not found"}</h1>
        <Link to="/" className="ghost-btn w-full">Back to home</Link>
      </section>
    </main>
  );

  if (order.status === "completed") return (
    <main className="grid min-h-screen place-items-center p-5 text-center">
      <section className="glass-panel p-10 max-w-md w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-700/50 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-800 border-2 border-accent-gold text-4xl shadow-[0_0_30px_rgba(214,166,77,0.4)] mb-8">
            ✨
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-2">Dining Completed</p>
          <h1 className="text-3xl font-bold text-white mb-8">Thank you for visiting<br /><span className="text-accent-amber glow-text">Khwaja Garib Nawaz</span></h1>
          
          <div className="glass-card p-6 text-left mb-8 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-cream-muted text-sm">Order Code</span>
              <span className="font-bold text-white bg-white/10 px-3 py-1 rounded-md tracking-wider">{order.orderCode}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-cream-muted text-sm">Total Paid</span>
              <span className="font-bold text-xl text-accent-gold">{money(order.total)}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-cream-muted text-sm">Payment Method</span>
                <span className="font-bold text-white uppercase text-sm tracking-wider">{order.paymentMethod}</span>
              </div>
            )}
          </div>
          
          <Link to={`/menu/${order.tableNumber}`} className="premium-btn w-full">Order Again</Link>
        </div>
      </section>
    </main>
  );

  const currentStage = stageIndex[order.status] ?? 0;
  
  return (
    <main className="min-h-screen px-4 py-8 pb-32">
      <section className="mx-auto max-w-lg space-y-6">
        
        {/* Header Card */}
        <header className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent-gold/20 blur-[40px] group-hover:bg-accent-gold/30 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-1">Live Tracking</p>
                <h1 className="text-2xl font-bold text-white">Order Confirmed</h1>
              </div>
              <div className="bg-brand-900/80 border border-accent-gold/30 px-3 py-2 rounded-lg text-center shadow-inner">
                <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-0.5">Table</p>
                <p className="text-xl font-bold text-accent-gold leading-none">{order.tableNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-cream-muted">Code:</span>
              <span className="font-mono font-bold tracking-widest text-white bg-white/10 px-3 py-1 rounded-md">{order.orderCode}</span>
            </div>
          </div>
        </header>

        {/* Live Status Tracker */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-amber"></span>
            </span>
            Preparation Status
          </h2>
          
          <div className="relative ml-4">
            {/* Vertical Line */}
            <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-brand-700/50">
              <div 
                className="absolute left-0 top-0 w-full bg-gradient-to-b from-accent-gold to-brand-500 transition-all duration-1000 ease-out" 
                style={{ height: `${(currentStage / (stages.length - 1)) * 100}%` }}
              ></div>
            </div>
            
            <div className="space-y-8 relative z-10">
              {stages.map((stage, index) => {
                const isCompleted = index < currentStage;
                const isCurrent = index === currentStage;
                
                return (
                  <div key={stage} className={`flex items-center gap-6 transition-opacity duration-500 ${index > currentStage ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="relative">
                      <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold shadow-lg transition-all duration-500 ${isCompleted ? "bg-accent-gold text-brand-900 border-2 border-accent-amber scale-90" : isCurrent ? "bg-brand-500 text-white border-2 border-brand-400 ring-4 ring-brand-500/30 scale-110" : "bg-brand-900 text-cream-muted border-2 border-brand-700"}`}>
                        {isCompleted ? "✓" : index + 1}
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold text-lg transition-colors ${isCurrent ? "text-white glow-text" : isCompleted ? "text-cream-base" : "text-cream-muted"}`}>
                        {stage}
                      </p>
                      {isCurrent && (
                        <p className="text-xs font-semibold text-accent-gold uppercase tracking-wider mt-1 animate-pulse">
                          In Progress
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Order Items Summary */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Order Summary</h2>
            <span className="text-sm font-medium bg-brand-800/80 text-cream-base px-3 py-1 rounded-full shadow-inner border border-white/5">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          </div>
          
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={`${item.name}-${item.price}`} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-xs font-bold text-accent-gold group-hover:bg-accent-gold/20 transition-colors">
                    {item.quantity}x
                  </span>
                  <span className="text-cream-base font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white">{money(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4">
            <span className="text-cream-muted font-medium">Grand Total</span>
            <span className="text-2xl font-bold text-accent-gold drop-shadow-md">{money(order.total)}</span>
          </div>
        </section>

        {/* Service Requests */}
        <section className="glass-card p-6 border-t-4 border-t-accent-gold/50">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold/80 mb-1">Service Hub</p>
            <h2 className="text-xl font-bold text-white">Need something else?</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {serviceOptions.map((opt) => (
              <button 
                key={opt.type} 
                disabled={Boolean(requestingType)} 
                onClick={() => requestService(opt.type)} 
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-brand-900/50 p-4 text-sm font-bold text-cream-base border border-white/5 shadow-inner hover:bg-brand-800 hover:border-white/10 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                {requestingType === opt.type ? "Sending..." : opt.label}
              </button>
            ))}
          </div>
          
          {serviceMessage && (
            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-[slideUp_0.3s_ease-out] ${serviceMessage.includes("sent") ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
              <span>{serviceMessage.includes("sent") ? "✓" : "!"}</span>
              {serviceMessage}
            </div>
          )}
        </section>

      </section>
    </main>
  );
}
