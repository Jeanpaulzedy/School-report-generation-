
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { LogIn, ShieldAlert, Loader2, User as UserIcon, Lock, Globe, RefreshCw, WifiOff, AlertTriangle, GraduationCap } from 'lucide-react';
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
          throw new Error('NETWORK_ERROR: Could not reach server. Check internet.');
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-[440px] w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden">
        {/* Header Section */}
        <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 shadow-xl">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">School AMIS</h1>
            <p className="text-indigo-100/80 font-semibold uppercase tracking-[0.2em] text-[10px] mt-1.5">Academic Management Portal</p>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full"></div>
        </div>
        
        {/* Form Section */}
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
            <button 
              type="button"
              onClick={verifyConnection}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${
                connStatus.status === 'checking' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                connStatus.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
              }`}
            >
              {connStatus.status === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 
               connStatus.ok ? <Globe size={12} /> : <WifiOff size={12} />}
              {connStatus.status === 'checking' ? 'Syncing...' : connStatus.ok ? 'Connected' : 'Offline'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-semibold text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Username or Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text" required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm"
                  placeholder="admin or email@school.rw"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password" required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                {loading ? 'Entering Portal...' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Rwanda Ministry of Education • Official Access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};