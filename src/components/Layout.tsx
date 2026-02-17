import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { isMock, setUseMock } from '../services/api';

export function Layout({ children }: { children: ReactNode }) {
  const toggleMock = () => {
    setUseMock(!isMock());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <Navbar />
      
      {/* Subtle Mock Indicator */}
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-1 px-4 sm:px-6 lg:px-8 flex justify-end items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMock() ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            {isMock() ? 'Modo Demo' : 'Producción'}
          </span>
          <button 
            onClick={toggleMock} 
            className="text-[10px] text-slate-600 hover:text-emerald-500 underline transition-colors"
          >
            Cambiar
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
      
      <footer className="border-t border-slate-900 mt-auto bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-sm font-medium">
            © 2024 PadelReserva. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-slate-600">
            <a href="#" className="hover:text-emerald-500 transition-colors text-sm">Términos</a>
            <a href="#" className="hover:text-emerald-500 transition-colors text-sm">Privacidad</a>
            <a href="#" className="hover:text-emerald-500 transition-colors text-sm">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
