import { Link } from "react-router-dom";

const demos = [
  { title: "Customer Demo", to: "/menu/1", description: "Place a dine-in order at Table 1", icon: "🍽️", highlight: true },
  { title: "Kitchen Dashboard", to: "/kitchen", description: "Manage live orders & food prep", icon: "👨‍🍳" },
  { title: "Waiter Dashboard", to: "/waiter", description: "Handle tables, service & billing", icon: "🛎️" },
  { title: "Owner Dashboard", to: "/admin", description: "Business analytics & insights", icon: "📊" },
  { title: "QR Codes", to: "/admin/qr", description: "Printable table access points", icon: "📱" }
];

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] p-8 sm:p-16 glass-panel border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/30 to-brand-900/80 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-gold/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent-gold/30 transition-all duration-700"></div>
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-float">
            <div>
              <p className="inline-block px-4 py-1.5 rounded-full border border-accent-gold/40 bg-accent-gold/10 text-accent-gold text-sm font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(214,166,77,0.15)]">
                Khwaja Garib Nawaz
              </p>
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-lg mb-4">
                KGN <span className="text-accent-gold glow-text">SmartServe</span>
              </h1>
              <p className="text-xl text-cream-muted font-light tracking-wide">
                Smart restaurant ordering system
              </p>
            </div>
            
            <p className="text-lg text-cream-muted/80 max-w-xl leading-relaxed">
              Experience the future of dine-in operations. A fully integrated platform syncing customers, kitchen, waiters, and management in real-time.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/menu/1" className="premium-btn text-lg group">
                Try Customer Demo
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block relative perspective-1000">
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] transform-gpu rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out glass-card border-white/20 p-2 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
               <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-transparent to-transparent z-10 rounded-xl pointer-events-none"></div>
               <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop" alt="Premium Food" className="w-full h-full object-cover rounded-xl shadow-inner opacity-80" />
               
               {/* Floating Badge */}
               <div className="absolute top-6 -left-6 z-20 glass-card p-4 flex items-center gap-4 animate-float" style={{ animationDelay: '1s' }}>
                 <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">Table 4 Paid</p>
                   <p className="text-xs text-cream-muted">Just now</p>
                 </div>
               </div>
               
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gradient-to-r from-accent-gold/0 via-accent-gold/50 to-accent-gold/0 flex-1"></div>
          <h2 className="text-2xl font-bold text-white tracking-wide uppercase text-center glow-text">Portal Access</h2>
          <div className="h-px bg-gradient-to-r from-accent-gold/0 via-accent-gold/50 to-accent-gold/0 flex-1"></div>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <Link key={demo.to} to={demo.to} className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] ${demo.highlight ? 'bg-gradient-to-br from-brand-800 to-brand-700 border-2 border-accent-gold/30 hover:border-accent-gold' : 'glass-card'}`}>
              {demo.highlight && <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
              
              <div className="relative z-10">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform origin-left">{demo.icon}</div>
                <h3 className={`text-xl font-bold mb-2 ${demo.highlight ? 'text-accent-gold' : 'text-white group-hover:text-accent-amber transition-colors'}`}>{demo.title}</h3>
                <p className="text-cream-muted/70 text-sm mb-6 min-h-[40px]">{demo.description}</p>
                
                <div className="flex items-center text-sm font-bold text-brand-300 group-hover:text-brand-400 transition-colors">
                  <span className="mr-2 uppercase tracking-wider">Access</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
