
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { LogIn, ShieldAlert, Loader2, User as UserIcon, Lock, Globe, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { supabase, checkConnection } from '../supabaseClient';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<{ok: boolean, status: string, message?: string}>({
    ok: false,
    status: 'checking'
  });

  const ADMIN_EMAIL = 'jeanpaulnsengimana18@gmail.com';

  const verifyConnection = async () => {
    setConnStatus(prev => ({ ...prev, status: 'checking' }));
    const result = await checkConnection();
    setConnStatus(result);
  };

  useEffect(() => {
    verifyConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let loginEmail = emailOrUser.trim();
      const identifier = loginEmail.toLowerCase();
      if (identifier === 'admin' || identifier === 'poadmin') {
        loginEmail = ADMIN_EMAIL;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (authError) {
        if (authError.message === 'Failed to fetch') {
          throw new Error('NETWORK_ERROR: Browser could not reach Supabase. Check internet.');
        }
        throw authError;
      }

      if (authData.user) {
        const userEmail = authData.user.email?.toLowerCase() || '';
        const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
        
        let finalUser: User = {
          id: authData.user.id,
          username: userEmail.split('@')[0],
          full_name: isAdmin ? 'Jean Paul (Administrator)' : 'School Staff',
          role: isAdmin ? UserRole.ADMIN : UserRole.TEACHER,
          email: userEmail
        };

        try {
          const { data: profileData, error: profileErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileErr && profileErr.code === '42P01') {
             throw new Error("DATABASE_NOT_INITIALIZED: Run the SQL initialization script.");
          }

          if (profileData) {
            finalUser = {
              ...finalUser,
              username: profileData.username || finalUser.username,
              full_name: profileData.full_name || finalUser.full_name,
              role: isAdmin ? UserRole.ADMIN : (profileData.role as UserRole || UserRole.TEACHER),
            };
          }
        } catch (profileErr: any) {
          console.warn("Continuing with session profile:", profileErr.message);
          if (profileErr.message?.includes('DATABASE_NOT_INITIALIZED')) {
             setError(profileErr.message);
             setLoading(false);
             return;
          }
        }
        
        onLogin(finalUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">School AMIS</h1>
            <p className="mt-2 text-indigo-100 font-bold uppercase tracking-[0.3em] text-[10px]">Rwanda National Portal</p>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Login</h2>
            
            <button 
              type="button"
              onClick={verifyConnection}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${
                connStatus.status === 'checking' ? 'bg-slate-50 text-slate-400 border-slate-100' :
                connStatus.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
              }`}
            >
              {connStatus.status === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 
               connStatus.ok ? <Globe size={12} /> : <WifiOff size={12} />}
              {connStatus.status}
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-5 rounded-2xl text-xs flex flex-col gap-3 animate-shake">
              <div className="flex items-start gap-4">
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <div className="flex flex-col gap-1">
                  <span className="font-bold leading-relaxed">{error}</span>
                  {error.includes('DATABASE_NOT_INITIALIZED') && (
                    <p className="text-rose-500 font-medium mt-2">Tables are missing. Please run the provided SQL script in your Supabase dashboard.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="group">
              <label className="block text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-3 ml-1">Username / Email</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text" required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="Email or 'admin'"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password" required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!connStatus.ok && connStatus.status !== 'checking')}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {loading ? 'Authenticating...' : 'Enter Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};
