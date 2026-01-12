import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { LogIn, Loader2, User as UserIcon, Lock, Globe, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase, checkConnection } from '../supabaseClient';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<{ok: boolean, status: string}>({
    ok: false,
    status: 'checking'
  });

  const ADMIN_EMAIL = 'jeanpaulnsengimana18@gmail.com';

  const verifyConnection = async () => {
    setConnStatus(prev => ({ ...prev, status: 'checking' }));
    const result = await checkConnection();
    setConnStatus({ ok: result.ok, status: result.status });
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

      if (authError) throw authError;

      if (authData.user) {
        const userEmail = authData.user.email?.toLowerCase() || '';
        const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
        
        let finalUser: User = {
          id: authData.user.id,
          username: userEmail.split('@')[0],
          full_name: isAdmin ? 'Jean Paul (Admin)' : 'Staff Member',
          role: isAdmin ? UserRole.ADMIN : UserRole.TEACHER,
          email: userEmail
        };

        const { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).maybeSingle();
        if (profile) {
          finalUser = { ...finalUser, ...profile };
        }
        
        onLogin(finalUser);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden flex flex-col">
        {/* Branding Header */}
        <div className="bg-indigo-600 p-10 text-white relative">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md mb-6">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">School AMIS</h1>
            <p className="text-indigo-100 font-medium text-sm mt-1 opacity-90">Rwanda National Academic Portal</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8"></div>
        </div>

        {/* Login Body */}
        <div className="p-8 sm:p-10 flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Account Sign In</h2>
            <button 
              type="button"
              onClick={verifyConnection}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                connStatus.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
              }`}
            >
              <Globe size={12} />
              {connStatus.ok ? 'Connected' : 'Syncing...'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-semibold text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text" required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/30 outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="Username or email"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Secure Password</label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password" required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/30 outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
              {loading ? 'Entering Portal...' : 'Continue to Dashboard'}
              {!loading && <ArrowRight size={18} className="opacity-50" />}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Official Education Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};