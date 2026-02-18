import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (code.length !== 6) return setError('El código debe tener 6 dígitos');
    setError('');
    setStep('password');
  };

  const handleResetPassword = async () => {
    setError('');
    if (newPassword.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (newPassword !== confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.resetPassword(email, code, newPassword);
      navigate('/login?reset=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Recuperar contraseña</h2>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {step === 'email' && (
          <>
            <p className="text-slate-400 mb-4">Ingresá tu email y te enviaremos un código de verificación.</p>
            <input className="input-field mb-4" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn-primary w-full" onClick={handleSendCode} disabled={loading || !email}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="text-slate-400 mb-4">Revisá tu email e ingresá el código de 6 dígitos.</p>
            <input className="input-field mb-4" type="text" placeholder="Código de verificación" maxLength={6} value={code} onChange={e => setCode(e.target.value)} />
            <button className="btn-primary w-full" onClick={handleVerifyCode} disabled={!code}>
              Verificar código
            </button>
          </>
        )}

        {step === 'password' && (
          <>
            <p className="text-slate-400 mb-4">Ingresá tu nueva contraseña (mínimo 8 caracteres).</p>
            <input className="input-field mb-4" type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <input className="input-field mb-4" type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} />
            <button className="btn-primary w-full" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </>
        )}

        <button className="btn-outline w-full mt-3" onClick={() => navigate('/login')}>
          Volver al login
        </button>
      </div>
    </div>
  );
}
