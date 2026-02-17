import { useState, useEffect } from 'react';
import { api, Booking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchBookings();
  }, [token, user, navigate]);

  const fetchBookings = async () => {
    try {
      if (!token) return;
      const res = await api.getAdminBookings(token);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    if (!token) return;
    setActionLoading(id);
    try {
      await api.adminConfirmBooking(token, id);
      await fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!token) return;
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    
    setActionLoading(id);
    try {
      await api.adminCancelBooking(token, id);
      await fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="text-center mt-20 text-emerald-400 font-mono">Cargando panel de administración...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 font-mono text-sm">
          Admin: {user?.name}
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950/50 text-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Fecha / Hora</th>
                <th className="p-4">Cancha</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No hay reservas registradas.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{format(new Date(booking.date), 'dd/MM/yyyy')}</div>
                      <div className="text-emerald-400 font-mono">{booking.time} hs</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{booking.courtName || `Cancha #${booking.courtId}`}</div>
                      <div className="text-xs">{booking.address}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span className="text-white">{booking.userName || 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-6">{booking.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        booking.status === 'confirmed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente Pago'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {actionLoading === booking.id ? (
                          <Loader2 className="animate-spin text-slate-500" size={18} />
                        ) : (
                          <>
                            {booking.status !== 'confirmed' && (
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                title="Marcar como Pagado"
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleCancel(booking.id)}
                              title="Cancelar Reserva"
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
