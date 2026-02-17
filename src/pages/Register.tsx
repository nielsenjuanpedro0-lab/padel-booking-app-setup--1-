import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-1 flex-col justify-center px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mb-6">
          <LayoutGrid className="text-emerald-500" size={24} />
        </div>
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Únete a la comunidad de pádel más grande de Necochea
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-slate-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-300">
              Nombre Completo
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border-0 bg-slate-950 py-2.5 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 pl-3 transition-all"
                placeholder="Juan Pérez"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-300">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border-0 bg-slate-950 py-2.5 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 pl-3 transition-all"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-300">
              Contraseña
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border-0 bg-slate-950 py-2.5 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 pl-3 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200"
            >
              Registrarse <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold leading-6 text-emerald-500 hover:text-emerald-400 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
