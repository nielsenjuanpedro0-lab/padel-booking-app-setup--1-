import { useState, useEffect } from 'react';
import { api, Court } from '../services/api';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Trophy } from 'lucide-react';

export default function Home() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [city] = useState('Necochea');

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await api.getCourts(city);
        setCourts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, [city]);

  if (loading) return <div className="text-center mt-20 text-emerald-500 font-mono text-sm animate-pulse">Cargando canchas...</div>;

  return (
    <div>
      <div className="relative mb-16 pt-12 pb-24 px-6 md:px-0 text-center">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent mb-6 tracking-tight">
          RESERVA TU CANCHA
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
          La experiencia premium de pádel en Necochea. Selecciona tu club favorito y asegura tu lugar en segundos.
        </p>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-emerald-500/10 blur-[100px] -z-10 rounded-full pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courts.map((court) => (
          <div 
            key={court.id} 
            className="group relative bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-emerald-500/10"
          >
            <div className="h-56 bg-slate-800 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
              {court.image ? (
                <img 
                  src={court.image} 
                  alt={court.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Trophy size={64} className="text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent z-10" />
              
              <div className="absolute bottom-4 left-6 z-20">
                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors shadow-black drop-shadow-lg">{court.name}</h3>
                <div className="flex items-center text-slate-300 text-sm drop-shadow-md">
                  <MapPin size={14} className="mr-1 text-emerald-500" />
                  <span>{court.address}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {court.amenities && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {court.amenities.map((amenity, index) => (
                    <span key={index} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-white/5 text-emerald-400 border border-emerald-500/20">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Precio por persona</span>
                  <span className="text-2xl font-bold text-white">${court.price.toLocaleString()}</span>
                </div>
                
                <Link 
                  to={`/court/${court.id}`} 
                  className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-emerald-400 font-semibold py-3 px-4 rounded-xl transition-all duration-300"
                >
                  Ver Horarios <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
