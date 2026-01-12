
import React, { useState, useEffect } from 'react';
import { User, SchoolSettings } from '../types';
import { Save, Building, Calendar, MapPin, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('school_settings').select('*').maybeSingle();
        if (error) throw error;
        
        if (data) {
          setSettings(data);
        } else {
          // Create initial settings if none exist
          const initial = {
            school_name: 'ESP RULI',
            academic_year: '2024/2025',
            current_term: 'Term 1',
            address: 'Ruli, Rwanda',
            logo_url: 'https://picsum.photos/200/200'
          };
          const { data: created, error: createError } = await supabase.from('school_settings').insert([initial]).select().single();
          if (createError) throw createError;
          setSettings(created);
        }
      } catch (err: any) {
        console.error('Settings error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('school_settings')
        .update(settings)
        .eq('id', settings.id);
        
      if (error) throw error;
      setFeedback({ type: 'success', msg: 'School configuration synchronized successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessing School Config...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {feedback && (
        <div className={`fixed top-4 right-4 ${feedback.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'} text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 font-black text-xs uppercase tracking-[0.2em] animate-in slide-in-from-right-8`}>
          {feedback.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
        <div className="relative group z-10">
          <img 
            src={settings.logo_url || 'https://picsum.photos/200/200'} 
            alt="School Logo" 
            className="w-40 h-40 rounded-[2rem] object-cover border-4 border-white shadow-2xl"
          />
          <button className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 text-white gap-2 backdrop-blur-sm">
            <Camera size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Update Logo</span>
          </button>
        </div>
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-tight">{settings.school_name}</h1>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mt-2">{settings.address || 'Kigali, Rwanda'}</p>
          <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl uppercase tracking-widest border border-emerald-100">
              REB Accredited
            </span>
            <span className="px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl uppercase tracking-widest border border-indigo-100">
              NESA Verified
            </span>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="relative z-10 flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 disabled:bg-slate-300 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Saving...' : 'Sync Settings'}
        </button>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-slate-50 rounded-full z-0"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-8">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
            <Building size={24} className="text-indigo-600" />
            School Identity
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Institution Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                value={settings.school_name}
                onChange={e => setSettings({...settings, school_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Address</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                  value={settings.address || ''}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-8">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
            <Calendar size={24} className="text-emerald-600" />
            Academic Period
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Year</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all cursor-pointer"
                value={settings.academic_year}
                onChange={e => setSettings({...settings, academic_year: e.target.value})}
              >
                <option value="2023/2024">2023/2024</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Active Term</label>
              <div className="grid grid-cols-3 gap-3">
                {['Term 1', 'Term 2', 'Term 3'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSettings({...settings, current_term: term})}
                    className={`py-4 px-3 rounded-2xl text-[10px] font-black transition-all border-2 uppercase tracking-widest ${
                      settings.current_term === term 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
