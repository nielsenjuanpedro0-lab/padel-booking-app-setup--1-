import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Court } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Info, DollarSign, Zap } from 'lucide-react';
import { format, addDays } from 'date-fns';
import confetti from 'canvas-confetti';

const SLOTS = [
  '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30'
];

const PLAYERS = 4;
const SERVICE_FEE = 2500;

export default function CourtDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [court, setCourt] = useState<Court | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'wallet' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    if (!id) return;
    const fetchCourt = async () => {
      try {
        const res = await api.getCourt(id);
        setCourt(res.data);
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };
    fetchCourt();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !date) return;
    const fetchBookings = async () => {
      try {
        const res = await api.getBookings(Number(id), date);
        setOccupiedSlots(res.data.map((b: any) => b.time));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [id, date]);

  // Timer logic
  useEffect(() => {
    if (!showPaymentModal || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showPaymentModal, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSlotClick = async (time: string) => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    // Create pending booking immediately
    setBookingLoading(true);
    try {
      const res = await api.createBooking(token, { court_id: Number(id), date, time });
      if (res.data.success) {
        setSelectedSlot(time);
        setCurrentBookingId(res.data.bookingId || null);
        setShowPaymentModal(true);
        setPaymentMethod(null);
        setMsg(null);
        setTimeLeft(30 * 60); // Reset timer
        // Optimistically mark as occupied so other users see it (if we re-fetched)
        // But for local UI, we just keep it occupied
        setOccupiedSlots(prev => [...prev, time]);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Error al reservar el turno' });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!currentBookingId || !token) return;

    setBookingLoading(true);
    try {
      await api.confirmBooking(token, currentBookingId);
      
      // Confetti effect from sides
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      setMsg({ type: 'success', text: '¡Pago recibido! Reserva confirmada con éxito.' });
      setShowPaymentModal(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Error al confirmar pago' });
      // Don't close modal if error, let them try again
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !court) return <div className="text-center mt-20 text-emerald-400 font-mono">Cargando detalles...</div>;

  const totalCourtPrice = court.price * PLAYERS;
  const grandTotal = totalCourtPrice + SERVICE_FEE;

  return (
    <div className="max-w-5xl mx-auto relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Calendar */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl relative overflow-hidden">
            
            {court.image && (
              <div className="h-64 w-full relative">
                <img src={court.image} alt={court.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              </div>
            )}

            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              <h1 className="text-4xl font-bold text-white mb-2">{court.name}</h1>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center text-slate-400">
                  <MapPin size={18} className="mr-2 text-emerald-500" />
                  <span>{court.address}, {court.city}</span>
                </div>
                
                {court.amenities && (
                  <div className="flex gap-2">
                    {court.amenities.map(am => (
                      <span key={am} className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 bg-slate-950/50 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Calendar className="text-emerald-400" size={24} />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fecha</span>
                  <input 
                    type="date" 
                    value={date} 
                    min={format(new Date(), 'yyyy-MM-dd')}
                    max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-white text-lg font-medium focus:outline-none border-b border-slate-700 focus:border-emerald-500 w-full"
                  />
                </div>
              </div>
              
              <div className="h-10 w-px bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-3">
                <Clock className="text-emerald-400" size={24} />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Duración</span>
                  <span className="text-white text-lg font-medium">90 min</span>
                </div>
              </div>
            </div>

            {msg && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'}`}>
                {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {msg.text}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SLOTS.map((slot) => {
                const isOccupied = occupiedSlots.includes(slot);
                const now = new Date();
                const [hours, minutes] = slot.split(':').map(Number);
                const isToday = format(now, 'yyyy-MM-dd') === date;
                const isPast = isToday && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes));
                const isUnavailable = isOccupied || isPast;

                return (
                  <button
                    key={slot}
                    disabled={isUnavailable || bookingLoading}
                    onClick={() => handleSlotClick(slot)}
                    className={`
                      relative group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden
                      ${isUnavailable 
                        ? 'bg-slate-900/30 border-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                        : 'bg-slate-800/50 border-slate-700 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20'}
                    `}
                  >
                    <span className="font-bold text-xl tracking-tight z-10">{slot}</span>
                    <span className="text-[10px] uppercase font-bold mt-1 z-10 opacity-70">
                      {isOccupied ? 'Ocupado' : isPast ? 'Cerrado' : 'Disponible'}
                    </span>
                    {!isUnavailable && <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />}
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary */}
        <div className="md:col-span-1">
          <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" />
              Resumen de Costos
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-slate-400 text-sm">
                <span>Precio por persona</span>
                <span className="text-slate-200">${court.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-sm">
                <span>Jugadores</span>
                <span className="text-slate-200">x {PLAYERS}</span>
              </div>
              <div className="h-px bg-slate-800 w-full" />
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Total Cancha</span>
                <span>${totalCourtPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 text-sm">
                <span className="flex items-center gap-1">Costo de Servicio <Info size={12} /></span>
                <span>+ ${SERVICE_FEE.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">Total Final</span>
                <span className="text-2xl font-bold text-white">${grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-center">
              <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                <Zap size={14} fill="currentColor" />
                ¡Saca tu turno de inmediato sin llamadas ni mensajes!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-white">Completar Pago</h2>
              <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-amber-500 font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <p className="text-slate-400 mb-6 text-sm">Elige tu método de pago para confirmar el turno antes de que expire.</p>

            <div className="mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
               <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                 <span className="text-slate-400 text-sm">Turno</span>
                 <span className="text-white font-medium">{date} - {selectedSlot}hs</span>
               </div>
               
               <div className="space-y-1">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Cancha ({PLAYERS} pax)</span>
                   <span className="text-slate-300">${totalCourtPrice.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Cargo de Servicio</span>
                   <span className="text-slate-300">+${SERVICE_FEE.toLocaleString()}</span>
                 </div>
               </div>

               <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                 <span className="text-white font-bold text-sm uppercase">Total Final</span>
                 <span className="text-emerald-400 font-bold text-xl">${grandTotal.toLocaleString()}</span>
               </div>
               
               <div className="bg-emerald-500/10 p-2 rounded-lg mt-2 text-center border border-emerald-500/20">
                 <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                   <Zap size={12} fill="currentColor" />
                   ¡Saca tu turno de inmediato sin llamadas ni mensajes!
                 </p>
               </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'transfer' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-700 p-2 rounded-lg">
                     <DollarSign size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Transferencia Bancaria</div>
                    <div className="text-xs opacity-70">CBU / Alias</div>
                  </div>
                </div>
                {paymentMethod === 'transfer' && <CheckCircle size={20} />}
              </button>

              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'wallet' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500/50'}`}
              >
                 <div className="flex items-center gap-3">
                  <div className="bg-slate-700 p-2 rounded-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Billetera Virtual</div>
                    <div className="text-xs opacity-70">Mercado Pago / Otras</div>
                  </div>
                </div>
                {paymentMethod === 'wallet' && <CheckCircle size={20} />}
              </button>
            </div>

            {paymentMethod === 'transfer' && (
              <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Banco</span>
                  <span className="text-white font-medium">Banco Nación</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alias</span>
                  <span className="text-white font-medium font-mono select-all">PADEL.NECO.APP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CBU</span>
                  <span className="text-white font-medium font-mono select-all">0000003100000000000000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular</span>
                  <span className="text-white font-medium">Padel Reserva S.A.</span>
                </div>
                <p className="text-xs text-amber-400 mt-2 pt-2 border-t border-slate-700">
                  * Envía el comprobante por WhatsApp para agilizar.
                </p>
              </div>
            )}

            {paymentMethod === 'wallet' && (
              <div className="mb-6">
                <button
                  onClick={async () => {
                    if (!currentBookingId || !token) return;
                    setBookingLoading(true);
                    try {
                      const res = await api.createPreference(token, currentBookingId);
                      window.location.href = res.data.init_point;
                    } catch (err) {
                      console.error(err);
                      setMsg({ type: 'error', text: 'Error al iniciar pago con Mercado Pago' });
                      setBookingLoading(false);
                    }
                  }}
                  className="block w-full bg-[#009EE3] hover:bg-[#008ED0] text-white font-bold py-3 px-4 rounded-xl text-center transition-colors mb-2"
                >
                  {bookingLoading ? 'Procesando...' : 'Pagar con Mercado Pago'}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Serás redirigido a Mercado Pago para abonar el cargo de servicio.
                </p>
              </div>
            )}

            <button
              disabled={!paymentMethod || bookingLoading}
              onClick={handleConfirmBooking}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !paymentMethod 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              {bookingLoading ? 'Procesando...' : paymentMethod === 'transfer' ? 'Ya transferí, Confirmar Reserva' : 'Ya pagué, Confirmar Reserva'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
