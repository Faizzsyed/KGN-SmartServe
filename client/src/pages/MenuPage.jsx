import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const categoryVisuals = { Biryani: "🍛", "Main Course": "🍲", Chinese: "🥢", Starters: "🍢", Bread: "🫓", Drinks: "🥤" };
const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

function InvalidTable() {
  return (
    <main className="grid min-h-screen place-items-center p-5 text-center">
      <section className="glass-panel p-10 max-w-sm w-full animate-float">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent-gold/20 border border-accent-gold/50 text-accent-gold text-3xl mb-6 shadow-[0_0_20px_rgba(214,166,77,0.3)]">
          !
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-amber mb-2">KGN SmartServe</p>
        <h1 className="text-3xl font-semibold text-white mb-4">Invalid Table</h1>
        <p className="leading-relaxed text-cream-muted/80">Please scan the QR code on a valid restaurant table to start your dine-in order.</p>
      </section>
    </main>
  );
}

export default function MenuPage() {
  const { tableNumber: tableParam } = useParams();
  const tableNumber = Number(tableParam);
  const isValidTable = Number.isInteger(tableNumber) && tableNumber >= 1 && tableNumber <= 8;
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    if (!isValidTable) return;
    api.get("/api/menu")
      .then(({ data }) => setItems(data.data || []))
      .catch(() => setError("We could not load the menu. Please try again."))
      .finally(() => setLoading(false));
  }, [isValidTable]);

  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen]);

  const categories = useMemo(() => ["All", ...new Set(items.map((item) => item.category))], [items]);
  const visibleItems = activeCategory === "All" ? items : items.filter((item) => item.category === activeCategory);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function changeQuantity(menuItem, change) {
    if (menuItem.isAvailable === false) return;
    setCart((current) => {
      const found = current.find((item) => item._id === menuItem._id);
      if (!found && change > 0) return [...current, { _id: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
      if (!found) return current;
      const quantity = found.quantity + change;
      if (quantity <= 0) return current.filter((item) => item._id !== menuItem._id);
      return current.map((item) => item._id === menuItem._id ? { ...item, quantity } : item);
    });
  }

  async function placeOrder() {
    if (!cart.length || placingOrder) return;
    setPlacingOrder(true);
    setOrderError("");
    try {
      const { data } = await api.post("/api/orders", { tableNumber, items: cart.map(({ name, price, quantity }) => ({ name, price, quantity })), total });
      localStorage.setItem("kgnLastOrder", data.data._id);
      navigate(`/order/${data.data._id}`);
    } catch (requestError) {
      setOrderError(requestError.response?.data?.message || "Could not place your order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (!isValidTable) return <InvalidTable />;

  return (
    <div className="pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-brand-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xl font-bold tracking-tight text-white glow-text">KGN <span className="text-accent-gold font-light">SmartServe</span></p>
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              <span className="bg-brand-700/50 text-accent-amber border border-accent-gold/20 px-3 py-1 rounded-full font-semibold shadow-inner">Table {tableNumber}</span>
              <span className="text-brand-300 font-medium tracking-wide uppercase">Dine-in</span>
            </div>
          </div>
          <button onClick={() => cart.length && setCartOpen(true)} className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-brand-700 to-brand-800 border border-white/10 flex items-center justify-center text-2xl shadow-lg transition-transform active:scale-95" aria-label="Open cart">
            🛍️
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold text-brand-900 text-xs font-bold shadow-[0_0_10px_rgba(214,166,77,0.5)] border-2 border-brand-900">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Menu Area */}
      <section className="mx-auto max-w-2xl px-4 pt-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold/80 mb-2 flex items-center gap-2">
            <span className="w-4 h-px bg-accent-gold/80"></span> Live Menu
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">What are you craving?</h1>
        </div>

        {/* Categories */}
        <div className="-mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
          {categories.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 snap-center ${activeCategory === category ? "bg-gradient-to-r from-accent-gold to-accent-amber text-brand-900 shadow-[0_5px_15px_rgba(214,166,77,0.3)] transform scale-105" : "glass-card text-cream-muted hover:text-white"}`}>
              {category === "All" ? "All dishes" : <span className="flex items-center gap-2"><span className="text-lg">{categoryVisuals[category] || "🍽️"}</span> {category}</span>}
            </button>
          ))}
        </div>

        {/* Items */}
        {loading && <div className="grid min-h-64 place-items-center rounded-3xl glass-card text-sm text-cream-muted/70 animate-pulse">Loading the culinary experience…</div>}
        {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 text-sm text-red-400 backdrop-blur-md">{error}</div>}
        
        {!loading && !error && (
          <div className="space-y-5">
            {visibleItems.map((item) => { 
              const cartItem = cart.find((cartEntry) => cartEntry._id === item._id); 
              return (
                <article key={item._id} className="relative overflow-hidden rounded-2xl glass-card p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/20 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex gap-4">
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-brand-800/80 border border-white/5 text-4xl shadow-inner">
                      {categoryVisuals[item.category] || "🍽️"}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h2 className="font-bold text-lg text-white truncate">{item.name}</h2>
                          <p className="mt-1 text-xs leading-5 text-cream-muted/70 line-clamp-2">{item.description || "Freshly prepared to perfection for your table."}</p>
                        </div>
                        <p className="whitespace-nowrap font-bold text-accent-gold text-lg">{money(item.price)}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-md border ${item.isAvailable ? "bg-brand-700/30 border-brand-500/30 text-brand-300" : "bg-red-500/10 border-red-500/20 text-red-400 font-semibold"}`}>
                          {item.isAvailable ? `⏱️ ${item.preparationTime || "15"} min` : "Sold Out"}
                        </span>
                        
                        {item.isAvailable && (
                          cartItem ? (
                            <div className="flex items-center rounded-lg bg-brand-700/50 border border-accent-gold/40 text-sm font-bold overflow-hidden shadow-inner">
                              <button className="px-4 py-1.5 text-accent-gold hover:bg-white/10 active:bg-white/20 transition-colors" onClick={() => changeQuantity(item, -1)}>−</button>
                              <span className="min-w-8 text-center text-white">{cartItem.quantity}</span>
                              <button className="px-4 py-1.5 text-accent-gold hover:bg-white/10 active:bg-white/20 transition-colors" onClick={() => changeQuantity(item, 1)}>+</button>
                            </div>
                          ) : (
                            <button onClick={() => changeQuantity(item, 1)} className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 text-xs font-bold text-white transition-all active:scale-95 shadow-sm">
                              Add +
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ); 
            })}
          </div>
        )}
      </section>

      {/* Sticky Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4 pointer-events-none">
          <button onClick={() => setCartOpen(true)} className="pointer-events-auto w-full max-w-md flex items-center justify-between rounded-2xl bg-gradient-to-r from-accent-gold to-accent-amber p-1 shadow-[0_10px_40px_rgba(214,166,77,0.3)] hover:scale-[1.02] transition-transform duration-300 active:scale-95">
            <div className="flex-1 bg-brand-900 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex flex-col items-start">
                <span className="text-xs text-cream-muted uppercase tracking-wider font-semibold mb-1">{totalItems} {totalItems === 1 ? "Item" : "Items"}</span>
                <span className="font-bold text-accent-gold text-lg leading-none">{money(total)}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-bold bg-white/10 px-4 py-2 rounded-lg">
                View Cart <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[100] bg-brand-900/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setCartOpen(false)}
          ></div>
          
          {/* Bottom Sheet */}
          <section 
            className="fixed z-[101] flex flex-col bg-brand-800 rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.5)] overflow-hidden" 
            style={{
              left: '50%',
              bottom: '16px',
              transform: 'translateX(-50%)',
              width: 'min(94vw, 620px)',
              maxHeight: '80vh',
            }}
          >
            <div className="p-6 border-b border-white/10 bg-brand-900/50 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-1">Table {tableNumber}</p>
                <h2 className="text-2xl font-bold text-white">Your Order</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="h-10 w-10 rounded-full glass-card flex items-center justify-center text-xl text-cream-muted hover:text-white hover:bg-white/10 transition-colors shrink-0">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              <div className="divide-y divide-white/5">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 py-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-lg">{item.name}</p>
                      <p className="mt-1 text-sm text-brand-300 font-medium">{money(item.price)} <span className="text-cream-muted/50 font-normal">each</span></p>
                    </div>
                    <div className="flex items-center rounded-lg bg-brand-900 border border-white/10 text-sm font-bold shadow-inner">
                      <button onClick={() => changeQuantity(item, -1)} className="px-4 py-2 text-cream-muted hover:text-white transition-colors">−</button>
                      <span className="min-w-8 text-center text-white">{item.quantity}</span>
                      <button onClick={() => changeQuantity(item, 1)} className="px-4 py-2 text-cream-muted hover:text-white transition-colors">+</button>
                    </div>
                    <p className="w-20 text-right font-bold text-accent-gold text-lg">{money(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 bg-brand-900/80 border-t border-white/10 shrink-0">
              <div className="flex items-center justify-between text-xl font-bold text-white mb-6">
                <span>Grand Total</span>
                <span className="text-2xl text-accent-gold drop-shadow-md">{money(total)}</span>
              </div>
              
              {orderError && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 text-center backdrop-blur-md animate-pulse">
                  {orderError}
                </div>
              )}
              
              <button disabled={placingOrder || !cart.length} onClick={placeOrder} className="w-full accent-btn text-lg h-14 disabled:opacity-50 disabled:cursor-not-allowed">
                {placingOrder ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-brand-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Confirming Order...
                  </span>
                ) : (
                  "Place Order to Kitchen"
                )}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
