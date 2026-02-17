import { useState, useEffect } from 'react';
import { api, Booking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBookings() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await api.getMyBookings(token);
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [token, navigate]);

  if (loading) return <div className="text-center mt-20 text-emerald-400 font-mono">Cargando reservas...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Mis Reservas</h1>
      {bookings.length === 0 ? (
        <div className="text-center bg-slate-900/50 p-16 rounded-2xl border border-white/5 backdrop-blur-sm">
          <Calendar size={48} className="mx-auto text-slate-600 mb-6" />
          <h3 className="text-xl font-medium text-white mb-2">No tienes reservas activas</h3>
          <p className="text-slate-400 mb-8">Explora las canchas disponibles y comienza a jugar.</p>
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl transition-all font-medium"
          >
            <Search size={18} /> Buscar Canchas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isPast = new Date(booking.date + 'T' + booking.time) < new Date();
            const isPending = booking.status === 'pending';
            
            return (
              <div 
                key={booking.id} 
                className={`group bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all hover:border-emerald-500/20 ${isPast ? 'opacity-50 grayscale hover:grayscale-0' : ''}`}
              >
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-2">
                    {booking.courtName || 'Cancha #' + booking.courtId}
                    {isPast && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">Finalizado</span>}
                    {isPending && !isPast && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/20 uppercase tracking-wider animate-pulse">Pago Pendiente</span>}
                  </h3>
                  <div className="flex items-center text-slate-400 text-sm">
                    <MapPin size={14} className="mr-1 text-emerald-500" />
                    <span>{booking.address}</span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:items-end gap-4 sm:gap-1">
                  <div className="flex items-center text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    <Calendar size={16} className="mr-2" />
                    <span>{format(new Date(booking.date), 'dd/MM/yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center justify-end text-slate-300">
                    <Clock size={16} className="mr-2 text-slate-500" />
                    <span className="font-mono">{booking.time} hs</span>
                  </div>
                  
                  {booking.price && (
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Precio: ${booking.price}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
