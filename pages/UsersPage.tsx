import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Mail, Edit2, Trash2, Loader2, X, Save, AlertCircle, UserCheck, Terminal, Copy, Check, Database, Eye, EyeOff, Key, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

export const UsersPage: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showFix, setShowFix] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    role: UserRole.TEACHER
  });

  const sqlFix = `-- POWERFUL OVERRIDE SCRIPT FOR ADMIN CONTROL
-- Run this in Supabase SQL Editor to allow absolute profile management.

DROP POLICY IF EXISTS "admin_access_policy" ON public.users;
DROP POLICY IF EXISTS "user_self_policy" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant the specific admin email full override permissions
CREATE POLICY "admin_access_policy" ON public.users 
FOR ALL
TO authenticated 
USING ( (auth.jwt() ->> 'email') = 'jeanpaulnsengimana18@gmail.com' )
WITH CHECK ( (auth.jwt() ->> 'email') = 'jeanpaulnsengimana18@gmail.com' );

-- Normal staff members can only view their own profile
CREATE POLICY "user_self_policy" ON public.users 
FOR SELECT TO authenticated 
USING ( auth.uid()::text = id::text );`;

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase.from('users').select('*').order('full_name', { ascending: true });
      if (fetchErr) throw fetchErr;
      setStaff(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // 1. Create Auth User
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role
          }
        }
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Authentication failed.");

      // 2. Create User Profile
      const { error: profileErr } = await supabase.from('users').insert([{
        id: authData.user.id,
        full_name: formData.full_name,
        username: formData.username || formData.email.split('@')[0],
        email: formData.email,
        role: formData.role
      }]);

      if (profileErr) throw profileErr;

      alert('Staff account created successfully.');
      setShowAddModal(false);
      setFormData({ full_name: '', email: '', username: '', password: '', role: UserRole.TEACHER });
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('DANGER: This will permanently remove this teacher and revoke their access. Marks recorded by this teacher will remain but may lose their recorder link. Continue?')) return;
    
    setProcessing(true);
    try {
      // Teachers often "block" deletion due to foreign keys in marks or classes.
      // We attempt to clear these links first. 
      // Note: We assume standard field names like 'teacher_id' or 'recorded_by'.
      
      // Try to clear references in classes (if they are a class teacher)
      await supabase.from('classes').update({ teacher_id: null } as any).eq('teacher_id', id as any);
      
      // Try to clear references in subjects
      await supabase.from('subjects').update({ teacher_id: null } as any).eq('teacher_id', id as any);
      
      // Finally delete the user
      const { error: delError } = await supabase.from('users').delete().eq('id', id);
      if (delError) throw delError;
      
      setStaff(prev => prev.filter(s => s.id !== id));
      alert('Staff profile and access removed.');
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}. If this persists, run the SQL "Security Fix" above to unlock the profiles table.`);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = staff.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
           <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Staff Directory</h2>
           <p className="text-slate-500 font-medium text-sm">Manage faculty accounts and system access.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowFix(!showFix)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
          >
            <ShieldCheck size={18} />
            Security Fix
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30"
          >
            <UserPlus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      {showFix && (
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-amber-400">
               <Terminal size={24} />
               <span className="text-[10px] font-black uppercase tracking-widest">Administrator Override Script</span>
            </div>
            <button 
              onClick={handleCopySql}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy SQL'}
            </button>
          </div>
          <pre className="bg-black/50 p-6 rounded-2xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/5">
            {sqlFix}
          </pre>
          <div className="mt-6 flex items-start gap-4 p-4 bg-amber-900/20 border border-amber-900/30 rounded-2xl text-amber-300">
             <AlertTriangle className="shrink-0 mt-0.5" size={20} />
             <p className="text-[11px] font-medium leading-relaxed uppercase tracking-wide">
               Run this script in your Supabase SQL Editor if you encounter "Permission Denied" errors while deleting staff.
             </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search staff by name or email..."
            className="bg-transparent border-none outline-none w-full text-sm font-bold uppercase tracking-tight placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name (Alphabetical)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Access</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System Role</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-8 py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px]">Registry Empty</td></tr>
            ) : filtered.map((s, index) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-6 text-center">
                   <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {index + 1}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                      {s.full_name.charAt(0)}
                    </div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.full_name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-bold text-slate-500">{s.email}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    s.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      disabled={processing}
                      onClick={() => deleteStaff(s.id)}
                      className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
                      title="Delete Teacher Access"
                    >
                      {processing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">New Account</h3>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-2">Create Faculty Access</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-indigo-500 p-2 rounded-xl transition-colors"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleCreateProfile} className="p-10 space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-4 text-rose-600 text-[11px] font-bold leading-relaxed">
                  <AlertCircle className="shrink-0" size={20} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Full Name</label>
                  <input 
                    required autoFocus type="text" 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                    placeholder="e.g. Jean Paul Nsengimana"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Email Address</label>
                  <input 
                    required type="email" 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                    placeholder="jp.nsenga@school.rw"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Password</label>
                    <div className="relative">
                      <input 
                        required type={showPassword ? 'text' : 'password'} 
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Account Role</label>
                    <select 
                      required className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    >
                      <option value={UserRole.TEACHER}>Teacher</option>
                      <option value={UserRole.ADMIN}>Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</button>
                <button 
                  disabled={processing}
                  type="submit"
                  className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-slate-300"
                >
                  {processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
