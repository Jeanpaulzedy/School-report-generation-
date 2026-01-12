
import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Loader2, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '' });

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from('classes').select('*').order('name');
      if (fetchError) throw fetchError;
      setClasses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('classes').insert([{ name: formData.name.toUpperCase() }]);
      if (insertError) throw insertError;
      setShowModal(false);
      setFormData({ name: '' });
      fetchClasses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Warning: Deleting a class will remove all linked student records. Continue?')) return;
    try {
      await supabase.from('classes').delete().eq('id', id);
      fetchClasses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Class Levels</h2>
          <p className="text-slate-500 font-medium">Defined academic streams.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={18} />
          Create Class
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center">
          <Layers size={56} className="mx-auto text-slate-200 mb-6" />
          <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">No Streams</h3>
          <p className="text-slate-400 mt-2 font-medium">Add levels like S1A, S6HGL, etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden text-center group transition-all hover:border-indigo-500">
              <div className="bg-indigo-600 py-12 text-white">
                <h3 className="text-4xl font-black tracking-tighter">{cls.name}</h3>
              </div>
              <div className="p-6">
                <button 
                  onClick={() => deleteClass(cls.id)}
                  className="w-full py-3 text-rose-500 text-[9px] font-black bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest"
                >
                  Delete Class
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight uppercase">Add Class</h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-indigo-500 p-2 rounded-xl"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold">{error}</div>}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Stream Name</label>
                <input 
                  required autoFocus type="text" 
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-black text-2xl text-slate-700"
                  placeholder="e.g. S1A"
                  value={formData.name}
                  onChange={e => setFormData({ name: e.target.value })}
                />
              </div>
              <button disabled={saving} type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Class
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
