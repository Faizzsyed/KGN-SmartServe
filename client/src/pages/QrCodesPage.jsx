import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";

export default function QrCodesPage() {
  const baseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
  // Generate for 8 tables
  const tables = Array.from({ length: 8 }, (_, index) => index + 1);

  return (
    <section className="space-y-8 pb-12">
      {/* Print-only CSS injection to ensure colors are respected and layout works */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 1rem !important; }
          .no-print { display: none !important; }
          .print-card { break-inside: avoid; border: 2px solid #d6a64d !important; border-radius: 1rem !important; background-color: #fff !important; padding: 1.5rem !important; margin-bottom: 1rem; }
          .print-text-dark { color: #0d3828 !important; }
          .print-text-gold { color: #b9801b !important; }
        }
      `}</style>
      
      {/* Header (Hidden in Print) */}
      <header className="glass-panel p-6 sm:p-10 relative overflow-hidden group no-print">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="inline-block px-3 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/10 text-accent-gold text-xs font-bold tracking-[0.2em] uppercase mb-4 shadow-inner">
              Admin Tool
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">Table QR Codes</h1>
            <p className="mt-2 text-sm text-cream-muted font-medium">Print and place one high-quality QR card on each table.</p>
          </div>
          
          <div className="flex gap-4">
            <Link to="/admin" className="px-5 py-3 rounded-xl border border-white/20 bg-brand-900/50 hover:bg-white/10 text-cream-base font-bold text-sm transition-colors backdrop-blur-sm">
              Back to Dashboard
            </Link>
            <button 
              onClick={() => window.print()} 
              className="accent-btn text-sm hover:scale-105 active:scale-95 group shadow-[0_5px_15px_rgba(214,166,77,0.3)]"
            >
              <span className="text-lg">🖨️</span> Print All Cards
            </button>
          </div>
        </div>
      </header>

      {/* Warning/Tip for screen users */}
      <div className="no-print p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-4">
        <span className="text-2xl mt-1">💡</span>
        <div>
          <p className="font-bold text-blue-300">Printing Tip</p>
          <p className="text-sm text-cream-muted mt-1">When the print dialog opens, ensure "Background graphics" is enabled and margins are set to "Minimum" for the best results. The cards will automatically format into a clean grid.</p>
        </div>
      </div>

      {/* QR Codes Grid (Visible on screen and print) */}
      <div className="print-area grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((tableNumber) => { 
          const path = `/menu/${tableNumber}`; 
          const fullUrl = `${baseUrl}${path}`;
          
          return (
            <article 
              key={tableNumber} 
              className="print-card relative overflow-hidden rounded-3xl glass-card p-8 text-center shadow-xl border border-accent-gold/30 hover:border-accent-gold/60 transition-colors group"
            >
              {/* Subtle background pattern for screen */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjE0LDE2Niw3NywwLjE1KSIvPjwvc3ZnPg==')] no-print pointer-events-none"></div>
              
              <div className="relative z-10">
                <p className="print-text-gold text-xs font-bold uppercase tracking-[0.2em] text-accent-gold mb-2 drop-shadow-sm">
                  Khwaja Garib Nawaz
                </p>
                <h2 className="print-text-dark text-3xl font-bold text-white mb-6">Table {tableNumber}</h2>
                
                <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(214,166,77,0.4)] transition-shadow duration-500 border border-white/20">
                  <QRCodeSVG 
                    value={fullUrl} 
                    size={180} 
                    bgColor="#ffffff" 
                    fgColor="#0d3828" 
                    level="Q" 
                    includeMargin={false}
                  />
                </div>
                
                <div className="mt-8 flex flex-col items-center">
                  <span className="print-text-dark text-xs uppercase tracking-widest font-bold text-cream-muted bg-white/5 px-3 py-1 rounded-full mb-2 border border-white/10">Scan to order</span>
                  <p className="print-text-dark text-[10px] text-cream-muted/50 font-mono tracking-wider break-all px-4">{fullUrl.replace(/^https?:\/\//, '')}</p>
                </div>
              </div>
            </article>
          ); 
        })}
      </div>
    </section>
  );
}
