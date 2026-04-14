import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Error de configuración', { description: 'Supabase no está configurado.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Acceso denegado', { 
        description: error.message.includes('Invalid login') 
          ? 'Correo o contraseña incorrectos.' 
          : 'Hubo un problema al iniciar sesión.'
      });
      setLoading(false);
    } else {
      toast.success('Bienvenido de nuevo', { description: 'Has iniciado sesión con éxito.' });
      // The session state listener in App/Store will handle redirect
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-40 h-28 flex items-center justify-center overflow-hidden mb-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white tracking-[0.2em] font-heading leading-none">CGC</h1>
              <p className="text-xs uppercase font-black text-blue-400 tracking-[0.4em] mt-2 opacity-90">SOFTWARE</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo Electrónico"
                  required
                  className="w-full bg-slate-950/50 border border-white/5 text-white placeholder-slate-500 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                  className="w-full bg-slate-950/50 border border-white/5 text-white placeholder-slate-500 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 font-medium">
            Acceso seguro · Protegido contra SQL Injection
          </p>
        </div>
      </div>
    </div>
  );
}
