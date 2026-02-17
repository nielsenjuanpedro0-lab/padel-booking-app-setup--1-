import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutGrid, UserCircle, Shield } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                <LayoutGrid size={18} className="text-emerald-500" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                PadelReserva
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-slate-400 hover:text-emerald-400 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Shield size={16} /> Admin
                  </Link>
                )}
                <Link 
                  to="/my-bookings" 
                  className="text-slate-400 hover:text-emerald-400 text-sm font-medium transition-colors"
                >
                  Mis Reservas
                </Link>
                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserCircle size={20} className="text-slate-500" />
                    <span className="text-sm font-medium hidden md:block">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                    title="Cerrar sesión"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  to="/login" 
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Ingresar
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary text-sm px-5 py-2"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
